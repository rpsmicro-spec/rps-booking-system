/**
 * What the UI does with each outcome of replaying a queued status change.
 * Called by the sync runner (src/lib/offline/sync.ts); must not import it.
 */
import { toast } from "sonner";
import { STATUS_LABELS } from "@/lib/constants";
import type { Job, JobStatus } from "@/types/types";
import type { PendingStatusChange } from "@/lib/offline/storage";
import { patchJobInCaches, revalidateJobLists } from "@/lib/swr/job-cache";
import {
  clearStatusOverride,
  getStatusOverride,
  updateStatusOverride,
} from "./status-overrides";

export const JOB_CHANGED_EVENT = "rps:job-changed";

export type StatusSyncResult =
  | { type: "applied"; entry: PendingStatusChange; job: Job | null; moreQueuedForJob: boolean }
  | { type: "network"; entry: PendingStatusChange }
  | { type: "conflict"; entry: PendingStatusChange; currentStatus: JobStatus | null; job: Job | null }
  | { type: "rejected"; entry: PendingStatusChange; message: string }
  | { type: "retry-later"; entry: PendingStatusChange; message: string };

const label = (status: string | null | undefined) =>
  (status && STATUS_LABELS[status as JobStatus]) || status || "Unknown";

/** Ask any mounted job page to re-render from the server (non-blocking). */
function announceJobChanged(jobId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(JOB_CHANGED_EVENT, { detail: { jobId } }));
}

export async function handleStatusSyncResult(result: StatusSyncResult) {
  const { entry } = result;
  const firstAttempt = entry.attempts === 0;

  switch (result.type) {
    case "applied": {
      if (!result.moreQueuedForJob) {
        // Keep showing the new status until the server render catches up.
        if (getStatusOverride(entry.jobId)) {
          updateStatusOverride(entry.jobId, { state: "confirmed" });
        }
      }
      await patchJobInCaches(entry.jobId, {
        status: (result.job?.status ?? entry.toStatus) as JobStatus,
        ...(result.job?.updated_at ? { updated_at: result.job.updated_at } : {}),
      });
      if (firstAttempt) {
        toast.success(`Status updated to ${label(entry.toStatus)}`);
      } else {
        toast.success(`${entry.jobNumber}: status change to ${label(entry.toStatus)} synced`);
      }
      announceJobChanged(entry.jobId);
      void revalidateJobLists();
      return;
    }

    case "network": {
      if (firstAttempt) {
        updateStatusOverride(entry.jobId, { state: "queued" });
        toast.info("Saved on this phone, will sync when you're back online", {
          id: `status-queued-${entry.id}`,
        });
      }
      return;
    }

    case "retry-later": {
      updateStatusOverride(entry.jobId, { state: "queued" });
      if (firstAttempt) {
        toast.warning(
          `Couldn't reach the server for ${entry.jobNumber} (${result.message}). Your change is saved on this phone and will be retried.`
        );
      }
      return;
    }

    case "conflict": {
      clearStatusOverride(entry.jobId);
      if (result.currentStatus) {
        await patchJobInCaches(entry.jobId, {
          status: result.currentStatus,
          ...(result.job?.updated_at ? { updated_at: result.job.updated_at } : {}),
        });
      }
      toast.error(
        `${entry.jobNumber} was changed to ${label(result.currentStatus)} by someone else — your change to ${label(entry.toStatus)} wasn't applied.`,
        { duration: 10000 }
      );
      announceJobChanged(entry.jobId);
      void revalidateJobLists();
      return;
    }

    case "rejected": {
      clearStatusOverride(entry.jobId);
      // Roll the cached copies back to what we last knew the server had.
      await patchJobInCaches(entry.jobId, { status: entry.fromStatus as JobStatus });
      toast.error(`${entry.jobNumber}: status change to ${label(entry.toStatus)} failed — ${result.message}`, {
        duration: 10000,
      });
      announceJobChanged(entry.jobId);
      void revalidateJobLists();
      return;
    }
  }
}
