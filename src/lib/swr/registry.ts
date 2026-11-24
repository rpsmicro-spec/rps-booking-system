/**
 * Bridge so non-React code (the offline sync runner, status-change helpers)
 * can mutate the dashboard's SWR cache. The global `mutate` exported by swr
 * is bound to SWR's default cache, not to our custom provider, so it would
 * silently do nothing here.
 */
import type { ScopedMutator } from "swr";
import { getPersistentCache, isPersistedKey } from "./persistent-cache";

let boundMutate: ScopedMutator | null = null;
let currentUserId: string | null = null;

export function registerSWR(mutate: ScopedMutator, userId: string | null) {
  boundMutate = mutate;
  currentUserId = userId;
}

export function getSWRMutate(): ScopedMutator | null {
  return boundMutate;
}

/** The signed-in user's id as known to the dashboard layout. */
export function getCurrentUserId(): string | null {
  return currentUserId;
}

/** All cached keys matching a predicate (only persisted-family keys). */
export function cachedKeys(predicate: (key: string) => boolean): string[] {
  if (typeof window === "undefined") return [];
  const out: string[] = [];
  for (const key of getPersistentCache().keys()) {
    if (isPersistedKey(key) && predicate(key)) out.push(key);
  }
  return out;
}
