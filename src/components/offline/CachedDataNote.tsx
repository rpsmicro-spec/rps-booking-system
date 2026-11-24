"use client";

import { useSyncExternalStore } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { format, isToday } from "date-fns";
import { getPersistentCache } from "@/lib/swr/persistent-cache";
import { isNetworkError } from "@/lib/offline/network";
import { useOnlineStatus } from "@/hooks/use-online-status";

const subscribeCache = (cb: () => void) =>
  typeof window === "undefined" ? () => {} : getPersistentCache().subscribe(cb);

/** When the data under an SWR key last came from the server. */
export function useSavedAt(key: string | null): number | null {
  return useSyncExternalStore(
    subscribeCache,
    () => (key ? getPersistentCache().getSavedAt(key) : null),
    () => null
  );
}

/**
 * Subtle "Offline — showing saved data from 10:42" line, shown only when the
 * list on screen came from the cache and the latest refresh couldn't happen.
 */
export function CachedDataNote({
  swrKey,
  error,
  hasData,
}: {
  swrKey: string | null;
  error: unknown;
  hasData: boolean;
}) {
  const isOnline = useOnlineStatus();
  const savedAt = useSavedAt(swrKey);
  const offline = !isOnline || isNetworkError(error);
  if (!hasData || (!offline && !error)) return null;

  const when = savedAt
    ? isToday(savedAt)
      ? format(savedAt, "HH:mm")
      : format(savedAt, "d MMM, HH:mm")
    : null;

  const Icon = offline ? CloudOff : RefreshCw;
  return (
    <p
      role="status"
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {offline ? "Offline" : "Couldn't refresh"} — showing saved data
      {when ? ` from ${when}` : ""}
    </p>
  );
}
