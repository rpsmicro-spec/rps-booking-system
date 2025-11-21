/**
 * Offline sync utilities
 * Handles syncing offline jobs to the server when online
 */

import { offlineStorage } from "./storage";
import { toast } from "sonner";

export async function syncOfflineJobs(): Promise<void> {
  // Check if online
  if (!navigator.onLine) {
    return;
  }

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

      // Prepare job data with uploaded photo URLs
      const jobData = {
        ...job.data,
        before_photos: beforePhotos,
        after_photos: afterPhotos,
      };

      // Submit job to server
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync job");
      }

      // Mark as synced
      await offlineStorage.updateOfflineJobStatus(job.id, "synced");

      // Clean up the offline job and its photos after successful sync
      await offlineStorage.deleteOfflineJob(job.id);
      syncedCount++;
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

// Auto-sync when coming online (only in browser, not SSR)
if (typeof window !== "undefined") {
  // Use a flag to prevent multiple simultaneous syncs
  let isSyncing = false;
  
  const safeSync = async () => {
    if (isSyncing) return;
    isSyncing = true;
    try {
      await syncOfflineJobs();
    } finally {
      isSyncing = false;
    }
  };

  window.addEventListener("online", () => {
    safeSync();
  });

  // Also sync on page load if online (with delay to avoid SSR issues)
  if (navigator.onLine) {
    setTimeout(() => {
      safeSync();
    }, 1000);
  }
}

