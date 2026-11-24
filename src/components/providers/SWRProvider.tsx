"use client";

import { useEffect, type ReactNode } from "react";
import { SWRConfig, useSWRConfig, type Cache } from "swr";
import { getPersistentCache } from "@/lib/swr/persistent-cache";
import { jsonFetcher } from "@/lib/swr/fetcher";
import { registerSWR } from "@/lib/swr/registry";

function Registrar({ userId }: { userId: string | null }) {
  const { mutate } = useSWRConfig();
  useEffect(() => {
    registerSWR(mutate, userId);
  }, [mutate, userId]);
  return null;
}

/**
 * Dashboard-wide SWR config backed by the persistent (localStorage) cache.
 * `userId` comes from the server layout's auth check; a cache written by a
 * different user is wiped before anything renders from it.
 */
export function SWRProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: () => {
          // Server: a fresh Map per request — never share across users.
          if (typeof window === "undefined") return new Map() as Cache;
          const cache = getPersistentCache();
          cache.setUser(userId);
          // Registered synchronously too so code running before effects
          // (e.g. an early sync) already sees the right user.
          return cache;
        },
        fetcher: jsonFetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        // Keep showing the last good data while a revalidation fails.
        keepPreviousData: true,
        // Slow, patchy links: retry a few times with backoff, not forever.
        errorRetryCount: 3,
      }}
    >
      <Registrar userId={userId} />
      {children}
    </SWRConfig>
  );
}
