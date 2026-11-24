/**
 * Optimistic status changes.
 *
 * Every change is written to the IndexedDB queue first and then replayed by
 * the sync runner, online or not. One path means one set of guarantees:
 * changes for a job are sent strictly in order, each carries
 * expected_status + an idempotency key, and a lost response is retried
 * safely. When online the runner sends it immediately, so it's as fast as a
 * direct PATCH.
 */
import { toast } from "sonner";
import { STATUS_LABELS } from "@/lib/constants";
import type { JobStatus } from "@/types/types";
import { offlineStorage, type PendingStatusChange } from "@/lib/offline/storage";
import { syncStatusChanges } from "@/lib/offline/sync";
import { fetchWithTimeout, isNetworkError, readJson } from "@/lib/offline/network";
import { getCurrentUserId } from "@/lib/swr/registry";
import { patchJobInCaches } from "@/lib/swr/job-cache";
import {
  clearStatusOverride,
  getStatusOverride,
  setStatusOverride,
  updateStatusOverride,
} from "./status-overrides";
import { JOB_CHANGED_EVENT } from "./status-sync-effects";

const PENDING_CHANGED_EVENT = "rps:pending-changed";

/** Tell the sync indicator the pending count changed. */
export function announcePendingChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PENDING_CHANGED_EVENT));
}
export { PENDING_CHANGED_EVENT };

function newId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export async function changeJobStatus(params: {
  jobId: string;
  jobNumber: string;
  fromStatus: JobStatus; // the status the user saw when choosing
  toStatus: JobStatus;
}): Promise<void> {
  const { jobId, jobNumber, fromStatus, toStatus } = params;
  const now = new Date().toISOString();
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  const previous = getStatusOverride(jobId);

  // 1. Optimistic UI everywhere: detail page (override) + cached lists.
  setStatusOverride(jobId, {
    status: toStatus,
    // Chained offline changes keep the original server base.
    baseStatus: previous && previous.state !== "confirmed" ? previous.baseStatus : fromStatus,
    state: offline ? "queued" : "sending",
    changedAt: now,
  });
  void patchJobInCaches(jobId, { status: toStatus });

  const entry: PendingStatusChange = {
    id: newId(),
    jobId,
    jobNumber,
    fromStatus,
    toStatus,
    createdAt: Date.now(),
    userId: getCurrentUserId(),
    attempts: 0,
  };

  // 2. Durable queue.
  try {
    await offlineStorage.init();
    await offlineStorage.addStatusChange(entry);
  } catch (error) {
    console.error("Could not queue status change, sending directly:", error);
    await sendDirect(entry);
    return;
  }
  announcePendingChanged();

  if (offline) {
    toast.info("Saved on this phone, will sync when you're back online");
    return;
  }

  // 3. Send now (in the background as far as the UI is concerned).
  void syncStatusChanges().finally(announcePendingChanged);
}

/**
 * Fallback when IndexedDB is unavailable (some private modes): plain PATCH
 * with the same guard fields, roll back on any failure. No offline support.
 */
async function sendDirect(entry: PendingStatusChange) {
  const rollback = (message: string) => {
    clearStatusOverride(entry.jobId);
    void patchJobInCaches(entry.jobId, { status: entry.fromStatus as JobStatus });
    toast.error(message);
  };
  try {
    const response = await fetchWithTimeout(`/api/jobs/${entry.jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: entry.toStatus,
        expected_status: entry.fromStatus,
        idempotency_key: entry.id,
      }),
    });
    const body = await readJson<{ error?: string; current_status?: string }>(response);
    if (response.status === 409) {
      const current = body?.current_status as JobStatus | undefined;
      rollback(
        `${entry.jobNumber} was changed to ${current ? STATUS_LABELS[current] : "another status"} by someone else — your change to ${STATUS_LABELS[entry.toStatus as JobStatus]} wasn't applied.`
      );
    } else if (!response.ok) {
      rollback(body?.error || "Failed to update status");
    } else {
      updateStatusOverride(entry.jobId, { state: "confirmed" });
      toast.success(`Status updated to ${STATUS_LABELS[entry.toStatus as JobStatus]}`);
    }
  } catch (error) {
    rollback(
      isNetworkError(error)
        ? "No connection — status not changed. Try again when you're online."
        : "Failed to update status"
    );
  }
  window.dispatchEvent(new CustomEvent(JOB_CHANGED_EVENT, { detail: { jobId: entry.jobId } }));
}

/**
 * Restore the optimistic view of queued changes for a job (after a reload,
 * or when the page is reopened while changes are still waiting).
 */
export async function restoreQueuedOverride(jobId: string): Promise<void> {
  try {
    await offlineStorage.init();
    const queued = (await offlineStorage.getStatusChanges()).filter((e) => e.jobId === jobId);
    if (queued.length === 0) return;
    if (getStatusOverride(jobId)) return; // live state already known
    const last = queued[queued.length - 1];
    setStatusOverride(jobId, {
      status: last.toStatus as JobStatus,
      baseStatus: queued[0].fromStatus as JobStatus,
      state: "queued",
      changedAt: new Date(last.createdAt).toISOString(),
    });
  } catch {
    // no queue available — nothing to restore
  }
}
