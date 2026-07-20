/**
 * Offline sync utilities
 * Handles syncing offline jobs to the server when online
 */

import { offlineStorage } from "./storage";
import { toast } from "sonner";

const SYNC_LOCK = "rps-offline-job-sync";

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

  const pendingJobs = await offlineStorage.getPendingJobs();

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
      const jobData = {
        ...jobDataWithoutNumber,
        before_photos: beforePhotos,
        after_photos: afterPhotos,
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
