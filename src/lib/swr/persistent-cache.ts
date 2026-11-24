/**
 * Persistent SWR cache: an in-memory Map (what SWR reads/writes) hydrated
 * synchronously from localStorage at first use and written back, debounced,
 * whenever SWR changes an entry.
 *
 * - Only whitelisted keys (jobs/customers lists, job details) are persisted.
 *   Anything else (e.g. /api/users/me) stays memory-only, which also keeps
 *   SSR-rendered SWR consumers free of hydration mismatches.
 * - LRU-capped by entry count and serialized size.
 * - Tagged with the signed-in user id: if a different user's id is found at
 *   hydration, the whole cache is dropped. Logout clears it explicitly too.
 *
 * Server: never use the singleton — every request gets a fresh Map (a shared
 * server Map would leak one user's data to another).
 */

import type { Cache, State } from "swr";

const STORAGE_KEY = "rps-swr-cache-v1";
// LRU caps per key family, so seeding job details from a list page can't
// evict the list pages themselves.
const MAX_LIST_ENTRIES = 30;
const MAX_DETAIL_ENTRIES = 50;
const MAX_BYTES = 1_500_000; // ~1.5MB, well inside the ~5MB localStorage quota
const WRITE_DEBOUNCE_MS = 400;

export const JOB_DETAIL_KEY_PREFIX = "job-detail:";
export const jobDetailKey = (jobId: string) => `${JOB_DETAIL_KEY_PREFIX}${jobId}`;

const PERSISTED_PREFIXES = ["/api/jobs?", "/api/customers?", JOB_DETAIL_KEY_PREFIX];
export function isPersistedKey(key: string): boolean {
  return PERSISTED_PREFIXES.some((p) => key.startsWith(p));
}

interface StoredEntry {
  data: unknown;
  savedAt: number; // when this data last came from the server
  touchedAt: number; // LRU order
}

interface StoredCache {
  userId: string | null;
  entries: Record<string, StoredEntry>;
}

type Listener = () => void;

class PersistentCache implements Cache {
  private map = new Map<string, State>();
  private meta = new Map<string, { savedAt: number; touchedAt: number }>();
  private userId: string | null = null;
  private writeTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<Listener>();

  constructor() {
    this.hydrate();
    if (typeof window !== "undefined") {
      // Flush pending writes when the app is backgrounded / closed.
      window.addEventListener("pagehide", () => this.flush());
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) this.flush();
      });
    }
  }

  // --- SWR Cache interface -------------------------------------------------
  keys() {
    return this.map.keys();
  }

  get(key: string): State | undefined {
    const value = this.map.get(key);
    if (value && this.meta.has(key)) this.meta.get(key)!.touchedAt = Date.now();
    return value;
  }

  set(key: string, value: State) {
    const prev = this.map.get(key);
    this.map.set(key, value);
    if (isPersistedKey(key) && value && value.data !== undefined && value.data !== prev?.data) {
      // New data arrived (fetch result or mutate): stamp it.
      this.meta.set(key, { savedAt: Date.now(), touchedAt: Date.now() });
      this.scheduleWrite();
      this.emit();
    }
  }

  delete(key: string) {
    this.map.delete(key);
    if (this.meta.delete(key)) this.scheduleWrite();
  }

  // --- Extras --------------------------------------------------------------

  /** When the data cached under `key` last came from the server (ms epoch). */
  getSavedAt(key: string): number | null {
    return this.meta.get(key)?.savedAt ?? null;
  }

  /** Bind the cache to a user; drops everything if it belonged to someone else. */
  setUser(userId: string | null) {
    if (this.userId && userId && this.userId !== userId) {
      this.clear();
    }
    this.userId = userId;
    this.scheduleWrite();
  }

  /** Wipe memory + storage (logout). */
  clear() {
    this.map.clear();
    this.meta.clear();
    if (this.writeTimer) clearTimeout(this.writeTimer);
    this.writeTimer = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable — nothing persisted anyway
    }
    this.emit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  // --- Persistence ---------------------------------------------------------
  private hydrate() {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (!raw) return;
    try {
      const stored = JSON.parse(raw) as StoredCache;
      this.userId = stored.userId ?? null;
      for (const [key, entry] of Object.entries(stored.entries ?? {})) {
        if (!isPersistedKey(key) || entry?.data === undefined) continue;
        this.map.set(key, { data: entry.data } as State);
        this.meta.set(key, { savedAt: entry.savedAt, touchedAt: entry.touchedAt });
      }
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }

  private scheduleWrite() {
    if (typeof window === "undefined") return;
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.flush();
    }, WRITE_DEBOUNCE_MS);
  }

  flush() {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    if (typeof window === "undefined") return;

    const candidates: [string, StoredEntry][] = [];
    for (const [key, m] of this.meta) {
      const data = this.map.get(key)?.data;
      if (data === undefined) continue;
      candidates.push([key, { data, savedAt: m.savedAt, touchedAt: m.touchedAt }]);
    }
    candidates.sort((a, b) => b[1].touchedAt - a[1].touchedAt); // most recent first
    let lists = 0;
    let details = 0;
    let kept: [string, StoredEntry][] = [];
    for (const candidate of candidates) {
      const isDetail = candidate[0].startsWith(JOB_DETAIL_KEY_PREFIX);
      if (isDetail ? details < MAX_DETAIL_ENTRIES : lists < MAX_LIST_ENTRIES) {
        kept.push(candidate);
        if (isDetail) details++;
        else lists++;
      } else {
        // Fell off the LRU tail: stop persisting it (memory copy stays
        // until reload, which is harmless).
        this.meta.delete(candidate[0]);
      }
    }

    while (kept.length > 0) {
      const payload = JSON.stringify({
        userId: this.userId,
        entries: Object.fromEntries(kept),
      } satisfies StoredCache);
      if (payload.length > MAX_BYTES) {
        kept = kept.slice(0, Math.max(0, Math.floor(kept.length * 0.75)));
        continue;
      }
      try {
        localStorage.setItem(STORAGE_KEY, payload);
        return;
      } catch {
        // Quota exceeded: shrink and retry.
        kept = kept.slice(0, Math.floor(kept.length / 2));
      }
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

let clientCache: PersistentCache | null = null;

/** The browser-side singleton. Throws on the server by design. */
export function getPersistentCache(): PersistentCache {
  if (typeof window === "undefined") {
    throw new Error("getPersistentCache() is browser-only");
  }
  if (!clientCache) clientCache = new PersistentCache();
  return clientCache;
}

/** Clear the persisted SWR cache without forcing it to be created. */
export function clearPersistentCache() {
  if (typeof window === "undefined") return;
  if (clientCache) clientCache.clear();
  else {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
