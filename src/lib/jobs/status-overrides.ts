/**
 * Client-side optimistic job status, layered over the server-rendered value.
 *
 * The job detail page is server-rendered, so after a status change the props
 * keep the old status until a background router.refresh() lands. Components
 * call useEffectiveJobStatus(jobId, serverStatus) to show the optimistic
 * value meanwhile, and to keep showing a queued offline change after a
 * reload until it syncs.
 */
import { useSyncExternalStore } from "react";
import type { JobStatus } from "@/types/types";

export interface StatusOverride {
  status: JobStatus; // what the UI should show
  baseStatus: JobStatus; // server status the first pending change was made from
  state: "sending" | "queued" | "confirmed";
  changedAt: string; // ISO, for the optimistic timeline entry
}

const overrides = new Map<string, StatusOverride>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  for (const l of listeners) l();
}

export function getStatusOverride(jobId: string): StatusOverride | undefined {
  return overrides.get(jobId);
}

export function setStatusOverride(jobId: string, override: StatusOverride) {
  overrides.set(jobId, override);
  emit();
}

export function updateStatusOverride(jobId: string, patch: Partial<StatusOverride>) {
  const current = overrides.get(jobId);
  if (!current) return;
  overrides.set(jobId, { ...current, ...patch });
  emit();
}

export function clearStatusOverride(jobId: string) {
  if (overrides.delete(jobId)) emit();
}

export function clearAllStatusOverrides() {
  if (overrides.size === 0) return;
  overrides.clear();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-renders whenever any override changes. */
export function useStatusOverride(jobId: string): StatusOverride | undefined {
  useSyncExternalStore(
    subscribe,
    () => version,
    () => 0
  );
  return overrides.get(jobId);
}

/**
 * The status to display. A "confirmed" override only wins while the server
 * props still show the pre-change status (refresh not landed yet); once the
 * server shows anything else, the server is the truth.
 */
export function resolveEffectiveStatus(
  serverStatus: JobStatus,
  override: StatusOverride | undefined
): JobStatus {
  if (!override) return serverStatus;
  if (override.state === "confirmed" && serverStatus !== override.baseStatus) {
    return serverStatus;
  }
  return override.status;
}

export function useEffectiveJobStatus(jobId: string, serverStatus: JobStatus) {
  const override = useStatusOverride(jobId);
  return {
    status: resolveEffectiveStatus(serverStatus, override),
    override,
    isPending: override?.state === "sending" || override?.state === "queued",
    isQueued: override?.state === "queued",
  };
}
