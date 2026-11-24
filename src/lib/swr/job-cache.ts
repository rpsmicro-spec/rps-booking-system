/**
 * Helpers to read/patch job data held in the SWR cache (list pages and the
 * per-job detail entries) without refetching.
 */
import type { Job } from "@/types/types";
import type { StatusHistory } from "@/features/jobs/components/StatusTimeline";
import { getPersistentCache, jobDetailKey } from "./persistent-cache";
import { cachedKeys, getSWRMutate } from "./registry";

export interface JobsListResponse {
  jobs: Job[];
  total: number;
  limit: number;
  offset: number;
}

export interface JobDetailEntry {
  job: Job;
  statusHistory?: StatusHistory[];
}

const isJobsListKey = (key: string) => key.startsWith("/api/jobs?");

/** Apply `patch` to every cached copy of a job (list pages + detail entry). */
export async function patchJobInCaches(jobId: string, patch: Partial<Job>) {
  const mutate = getSWRMutate();
  if (!mutate) return;

  await Promise.all(
    cachedKeys(isJobsListKey).map((key) =>
      mutate<JobsListResponse>(
        key,
        (data) => {
          if (!data?.jobs?.some((j) => j.id === jobId)) return data;
          return { ...data, jobs: data.jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)) };
        },
        { revalidate: false }
      )
    )
  );

  await mutate<JobDetailEntry>(
    jobDetailKey(jobId),
    (entry) => (entry ? { ...entry, job: { ...entry.job, ...patch } } : entry),
    { revalidate: false }
  );
}

/** Revalidate every mounted jobs list (unmounted keys refresh on next visit). */
export async function revalidateJobLists() {
  const mutate = getSWRMutate();
  if (!mutate) return;
  await mutate((key) => typeof key === "string" && isJobsListKey(key));
}

export function getCachedJobDetail(jobId: string): JobDetailEntry | undefined {
  if (typeof window === "undefined") return undefined;
  return getPersistentCache().get(jobDetailKey(jobId))?.data as JobDetailEntry | undefined;
}

/** Store a job's detail JSON (on view). */
export function storeJobDetail(entry: JobDetailEntry) {
  const mutate = getSWRMutate();
  if (!mutate) return;
  void mutate(jobDetailKey(entry.job.id), entry, { revalidate: false });
}

/**
 * Cheaply seed detail entries from a list page's rows (same `select *`
 * shape). Never overwrites a newer entry; drops the cached history when the
 * row is newer, since it may no longer match.
 */
export function seedJobDetailsFromList(jobs: Job[]) {
  const mutate = getSWRMutate();
  if (!mutate) return;
  for (const job of jobs) {
    const existing = getCachedJobDetail(job.id);
    const existingAt = existing?.job.updated_at ?? "";
    const rowAt = job.updated_at ?? "";
    if (existing && existingAt >= rowAt) continue;
    void mutate(
      jobDetailKey(job.id),
      { job, statusHistory: existing && existingAt === rowAt ? existing.statusHistory : undefined },
      { revalidate: false }
    );
  }
}

/** Drop a deleted job from every cached list page and its detail entry. */
export async function removeJobFromCaches(jobId: string) {
  const mutate = getSWRMutate();
  if (!mutate) return;
  await Promise.all(
    cachedKeys(isJobsListKey).map((key) =>
      mutate<JobsListResponse>(
        key,
        (data) => {
          if (!data?.jobs?.some((j) => j.id === jobId)) return data;
          return {
            ...data,
            jobs: data.jobs.filter((j) => j.id !== jobId),
            total: Math.max(0, (data.total ?? 1) - 1),
          };
        },
        { revalidate: false }
      )
    )
  );
  await mutate(jobDetailKey(jobId), undefined, { revalidate: false });
}
