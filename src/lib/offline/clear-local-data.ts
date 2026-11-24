/**
 * Remove cached *read* data belonging to the signed-in user from this device,
 * so the next person to log in on a shared phone never sees it.
 *
 * Deliberately does NOT touch the offline write queues (jobs created offline,
 * queued status changes): deleting those would lose work. The logout handlers
 * refuse to log out while such work is still pending (see
 * getPendingWorkCount).
 */
import { clearPersistentCache } from "@/lib/swr/persistent-cache";
import { offlineStorage } from "./storage";
import { clearAllStatusOverrides } from "@/lib/jobs/status-overrides";

// Service-worker runtime caches (next-pwa defaults) that hold authenticated
// API responses and rendered pages.
const SW_USER_CACHES = ["apis", "pages", "pages-rsc", "pages-rsc-prefetch", "others"];

export async function clearLocalUserData(): Promise<void> {
  clearPersistentCache();
  clearAllStatusOverrides();
  try {
    await offlineStorage.init();
    await offlineStorage.clearRecentJobs();
  } catch (error) {
    console.error("Failed to clear recent jobs:", error);
  }
  try {
    if (typeof caches !== "undefined") {
      await Promise.all(SW_USER_CACHES.map((name) => caches.delete(name)));
    }
  } catch (error) {
    console.error("Failed to clear service worker caches:", error);
  }
}

/** Offline jobs + status changes not yet on the server. */
export async function getPendingWorkCount(): Promise<number> {
  try {
    await offlineStorage.init();
    const [jobs, changes] = await Promise.all([
      offlineStorage.getOfflineJobs(),
      offlineStorage.getStatusChanges(),
    ]);
    return jobs.filter((job) => job.status !== "synced").length + changes.length;
  } catch {
    return 0;
  }
}

/**
 * Try to flush the offline queues before logging out. Returns how many
 * items are still unsynced afterwards (0 = safe to log out).
 */
export async function syncBeforeLogout(): Promise<number> {
  let pending = await getPendingWorkCount();
  if (pending === 0) return 0;
  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const { syncOfflineJobs } = await import("./sync");
      await syncOfflineJobs();
    } catch (error) {
      console.error("Sync before logout failed:", error);
    }
    pending = await getPendingWorkCount();
  }
  return pending;
}
