/**
 * Offline sync utilities
 * Handles syncing offline jobs to the server when online
 */

import { offlineStorage, type PendingStatusChange } from "./storage";
import { toast } from "sonner";
import { fetchWithTimeout, isNetworkError, readJson } from "./network";
import { getCurrentUserId } from "@/lib/swr/registry";
import { handleStatusSyncResult } from "@/lib/jobs/status-sync-effects";
import type { Job, JobStatus } from "@/types/types";

const SYNC_LOCK = "rps-offline-job-sync";
// Status changes get their own lock: they're tiny and the user is waiting on
// them, so they must not sit behind a multi-minute offline photo upload in
// the job queue. Each queue is still strictly single-flight across tabs.
const STATUS_SYNC_LOCK = "rps-offline-status-sync";

/**
 * Sync all pending offline jobs. Single-flight across every caller AND every
 * open tab via the Web Locks API — the TopBar mounts two sync indicators and
 * sync.ts has its own online/load triggers, so without the lock the same job
 * could be read as "pending" by two runners and submitted twice.
 */
export async function syncOfflineJobs(): Promise<void> {
  if (!navigator.onLine) {
    return;
  }

  // Status changes first: quick, and independent of offline-created jobs
  // (those have no server id yet, so no status change can target them).
  await syncStatusChanges();

  if (typeof navigator.locks?.request === "function") {
    await navigator.locks.request(SYNC_LOCK, { ifAvailable: true }, async (lock) => {
      if (!lock) return; // another runner (possibly another tab) is already syncing
      await runSync();
    });
  } else {
    await runSync();
  }
}

async function runSync(): Promise<void> {
  // Recover jobs stranded in "syncing" by a previous run that died mid-flight
  // (tab closed, phone slept). Safe here: we hold the sync lock, so no live
  // run owns them.
  await offlineStorage.resetStuckSyncingJobs();

  // Only replay jobs queued by the signed-in user (or legacy entries with
  // no owner) — never submit someone else's queued job under this account.
  const me = getCurrentUserId();
  const pendingJobs = (await offlineStorage.getPendingJobs()).filter(
    (job) => !job.userId || job.userId === me
  );

  if (pendingJobs.length === 0) {
    return;
  }

  // Show sync notification
  toast.info(`Syncing ${pendingJobs.length} offline job(s)...`);

  let syncedCount = 0;
  for (const job of pendingJobs) {
    try {
      // Update status to syncing
      await offlineStorage.updateOfflineJobStatus(job.id, "syncing");

      // Get photos from IndexedDB
      const photos = await offlineStorage.getOfflineJobPhotos(job);

      // Upload photos first
      const { uploadFile } = await import("@/features/jobs/utils/upload");

      const beforePhotos = await Promise.all(
        photos.before.map(async (file) => {
          return await uploadFile(file, {
            bucket: "job-photos",
            compress: true,
            maxSizeMB: 5,
          });
        })
      );

      const afterPhotos = await Promise.all(
        photos.after.map(async (file) => {
          return await uploadFile(file, {
            bucket: "job-photos",
            compress: true,
            maxSizeMB: 5,
          });
        })
      );

      // Upload the invoice file if one was attached while offline
      // (mirrors the online upload path in JobForm)
      const invoiceFile = await offlineStorage.getOfflineJobInvoice(job);
      const invoiceFilePath = invoiceFile
        ? await uploadFile(invoiceFile, {
            bucket: "invoices",
            folder: "invoices",
            maxSizeMB: 5,
          })
        : typeof job.data.invoice_file_path === "string"
          ? job.data.invoice_file_path
          : "";

      // Prepare job data with uploaded photo URLs
      // Remove job_number so the API generates a fresh one on sync
      // This ensures offline jobs get the next available job number when syncing
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { job_number, ...jobDataWithoutNumber } = job.data;
      // Keep any photo URLs that were already uploaded when the job was
      // queued, then append the ones uploaded now.
      const keptUrls = (list: unknown) =>
        Array.isArray(list) ? list.filter((p): p is string => typeof p === "string" && p.length > 0) : [];
      const jobData = {
        ...jobDataWithoutNumber,
        before_photos: [...keptUrls(job.data.before_photos), ...beforePhotos],
        after_photos: [...keptUrls(job.data.after_photos), ...afterPhotos],
        invoice_file_path: invoiceFilePath,
        // Idempotency key: if a previous attempt reached the server but the
        // response was lost, the API returns the existing job instead of
        // creating a duplicate.
        client_ref: job.id,
      };

      // Submit job to server
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        let message = "Failed to sync job";
        try {
          const error = await response.json();
          message = error.error || message;
        } catch {
          message = `Failed to sync job (HTTP ${response.status})`;
        }
        throw new Error(message);
      }

      syncedCount++;

      // Local cleanup after a confirmed server write. A cleanup failure must
      // NOT mark the job "error" — that would re-queue a job the server
      // already has. The client_ref dedupe would catch the replay, but there
      // is no reason to re-upload photos in the first place.
      try {
        await offlineStorage.updateOfflineJobStatus(job.id, "synced");
        await offlineStorage.deleteOfflineJob(job.id);
      } catch (cleanupError) {
        console.error(
          "Job synced to server but local cleanup failed:",
          cleanupError
        );
      }
    } catch (error) {
      console.error("Error syncing offline job:", error);
      await offlineStorage.updateOfflineJobStatus(
        job.id,
        "error",
        error instanceof Error ? error.message : "Unknown error"
      );
      toast.error(`Failed to sync job: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  if (syncedCount > 0) {
    toast.success(`Successfully synced ${syncedCount} job(s)`);
  }
}

/**
 * Replay queued status changes in order. Waits for the lock (rather than
 * skipping like the job queue) so a change queued while another run is in
 * flight is picked up by the next run instead of being left behind; runs
 * are short, and an empty run is a single IndexedDB read.
 */
export async function syncStatusChanges(): Promise<void> {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.locks?.request === "function") {
    await navigator.locks.request(STATUS_SYNC_LOCK, () => runStatusSync());
  } else {
    await runStatusSync();
  }
}

async function runStatusSync(): Promise<void> {
  let entries: PendingStatusChange[];
  try {
    await offlineStorage.init();
    entries = await offlineStorage.getStatusChanges();
  } catch (error) {
    console.error("Could not read queued status changes:", error);
    return;
  }

  const me = getCurrentUserId();
  // Unknown current user (layout not mounted yet): only ownerless entries.
  entries = entries.filter((e) => !e.userId || e.userId === me);
  if (entries.length === 0) return;

  // Jobs to skip for the rest of this run: their chain was dropped
  // (conflict/rejection) or is blocked behind a retry-later entry. Order is
  // only guaranteed per job, so other jobs carry on.
  const skipJobs = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (skipJobs.has(entry.jobId)) continue;

    const laterForJob = entries.slice(i + 1).filter((e) => e.jobId === entry.jobId);
    const dropChain = async () => {
      skipJobs.add(entry.jobId);
      await offlineStorage.deleteStatusChanges([entry.id, ...laterForJob.map((e) => e.id)]);
    };

    let response: Response;
    let body: { job?: Job; error?: string; current_status?: JobStatus } | null;
    try {
      response = await fetchWithTimeout(`/api/jobs/${entry.jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: entry.toStatus,
          expected_status: entry.fromStatus,
          idempotency_key: entry.id,
        }),
      });
      body = await readJson(response);
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      // Possibly applied, possibly not — keep it; the replay is idempotent.
      // Stop here so later changes never overtake this one.
      await offlineStorage
        .updateStatusChange(entry.id, { attempts: entry.attempts + 1, lastError: error.message })
        .catch(() => {});
      await handleStatusSyncResult({ type: "network", entry });
      return;
    }

    if (response.ok) {
      await offlineStorage.deleteStatusChanges([entry.id]);
      await handleStatusSyncResult({
        type: "applied",
        entry,
        job: body?.job ?? null,
        moreQueuedForJob: laterForJob.length > 0,
      });
      continue;
    }

    if (response.status === 409) {
      // The job moved on without us. Later queued changes for this job were
      // built on top of this one, so they're void too.
      await dropChain();
      await handleStatusSyncResult({
        type: "conflict",
        entry,
        currentStatus: (body?.current_status ?? body?.job?.status ?? null) as JobStatus | null,
        job: body?.job ?? null,
      });
      continue;
    }

    if (response.status === 401 || response.status === 429 || response.status >= 500) {
      // Session expired / server trouble: keep everything, retry later.
      const message = body?.error || `HTTP ${response.status}`;
      await offlineStorage
        .updateStatusChange(entry.id, { attempts: entry.attempts + 1, lastError: message })
        .catch(() => {});
      await handleStatusSyncResult({ type: "retry-later", entry, message });
      skipJobs.add(entry.jobId);
      continue;
    }

    // 400 / 403 / 404: the server refused this change for good.
    await dropChain();
    await handleStatusSyncResult({
      type: "rejected",
      entry,
      message: body?.error || `HTTP ${response.status}`,
    });
  }
}

// Auto-sync when coming online (only in browser, not SSR).
// syncOfflineJobs is internally single-flight, so no extra guard needed here.
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncOfflineJobs();
  });

  // Also sync on page load if online (with delay to avoid SSR issues)
  if (navigator.onLine) {
    setTimeout(() => {
      syncOfflineJobs();
    }, 1000);
  }
}
