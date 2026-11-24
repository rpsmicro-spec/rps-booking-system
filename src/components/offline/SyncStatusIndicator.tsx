"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, CloudOff, CloudCheck, CloudAlert, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { syncOfflineJobs } from "@/lib/offline/sync";
import {
  offlineStorage,
  type OfflineJob,
  type PendingStatusChange,
} from "@/lib/offline/storage";
import { PENDING_CHANGED_EVENT } from "@/lib/jobs/status-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingJobs, setPendingJobs] = useState<OfflineJob[]>([]);
  const [pendingStatusChanges, setPendingStatusChanges] = useState<PendingStatusChange[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Check internet connection via our own API (same-origin, no CORS issues).
  // External checks (cloudflare.com, api.resend.com, supabase REST) were removed
  // because they always fail with CORS/401 errors from the browser.
  // Must poll /api/ping (no auth) — polling an authed endpoint hits Supabase
  // on every request and drains the database's Disk IO budget.
  const checkInternetConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("/api/ping", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      setIsOnline(res.ok || res.status < 500);
    } catch {
      setIsOnline(navigator.onLine);
    }
  }, []);

  const loadPendingJobs = useCallback(async () => {
    try {
      await offlineStorage.init();
      const [pending, statusChanges] = await Promise.all([
        offlineStorage.getPendingJobs(),
        offlineStorage.getStatusChanges(),
      ]);
      setPendingJobs(pending);
      setPendingStatusChanges(statusChanges);
    } catch (error) {
      console.error("Error loading pending jobs:", error);
    }
  }, []);

  const handleSync = useCallback(async () => {
    if (!isOnline) {
      toast.error("You're currently offline. Please check your connection.");
      return;
    }

    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await syncOfflineJobs();
      setLastSyncTime(Date.now());
      await loadPendingJobs();
    } catch (error) {
      console.error("Error syncing:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, loadPendingJobs]);

  useEffect(() => {
    const updateOnlineStatus = async () => {
      // Check actual connection when online event fires
      if (navigator.onLine) {
        await checkInternetConnection();
      } else {
        setIsOnline(false);
      }
    };

    const handleOffline = () => setIsOnline(false);

    // Initial connection check
    checkInternetConnection();

    // Load pending jobs
    loadPendingJobs();

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", handleOffline);
    // Status changes queued/synced elsewhere in the app.
    window.addEventListener(PENDING_CHANGED_EVENT, loadPendingJobs);

    // Poll for connection and pending jobs every 60 seconds, but not in
    // hidden tabs — a visibilitychange re-check covers them on return.
    const interval = setInterval(() => {
      if (document.hidden) return;
      checkInternetConnection();
      loadPendingJobs();
    }, 60000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkInternetConnection();
        loadPendingJobs();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(PENDING_CHANGED_EVENT, loadPendingJobs);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [loadPendingJobs, checkInternetConnection]);

  useEffect(() => {
    if (isOnline && pendingJobs.length + pendingStatusChanges.length > 0 && !isSyncing) {
      // Auto-sync when coming online (with a small delay to avoid race conditions)
      const timeoutId = setTimeout(() => {
        handleSync();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, pendingJobs.length, pendingStatusChanges.length, isSyncing, handleSync]);

  const hasErrors =
    pendingJobs.some((job) => job.status === "error") ||
    pendingStatusChanges.some((c) => !!c.lastError && c.attempts > 1);
  const pendingCount = pendingJobs.length + pendingStatusChanges.length;

  // "2 jobs and 1 status change"
  const describePending = () => {
    const parts: string[] = [];
    if (pendingJobs.length > 0) {
      parts.push(`${pendingJobs.length} job${pendingJobs.length !== 1 ? "s" : ""}`);
    }
    if (pendingStatusChanges.length > 0) {
      parts.push(
        `${pendingStatusChanges.length} status change${pendingStatusChanges.length !== 1 ? "s" : ""}`
      );
    }
    return parts.join(" and ");
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="size-[18px] animate-spin text-blue-600 dark:text-blue-400" />;
    }
    if (!isOnline) {
      return <CloudOff className="size-[18px] text-orange-600 dark:text-orange-400" />;
    }
    if (pendingCount > 0) {
      return hasErrors ? (
        <CloudAlert className="size-[18px] text-red-600 dark:text-red-400" />
      ) : (
        <CloudUpload className="size-[18px] text-amber-600 dark:text-amber-400" />
      );
    }
    return <CloudCheck className="size-[18px] text-emerald-600/80 dark:text-emerald-400/80" />;
  };

  const formatLastSaved = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      return "Just now";
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  const getTooltipContent = () => {
    if (isSyncing) {
      return (
        <div className="space-y-1">
          <p className="font-medium">Syncing...</p>
          <p className="text-xs text-muted-foreground">
            Please wait while data is being synchronized
          </p>
        </div>
      );
    }

    if (!isOnline) {
      return (
        <div className="space-y-1">
          <p className="font-medium">No Internet Connection</p>
          <p className="text-xs text-muted-foreground">
            {pendingCount > 0
              ? `${describePending()} will sync when connection is restored`
              : "Check your internet connection"}
          </p>
        </div>
      );
    }

    if (pendingCount > 0) {
      const errorJobs = pendingJobs.filter((job) => job.status === "error");
      return (
        <div className="space-y-1">
          <p className="font-medium">Sync Pending</p>
          <p className="text-xs">
            {describePending()} waiting to sync
          </p>
          {errorJobs.length > 0 && (
            <p className="text-xs text-red-400">
              {errorJobs.length} failed to sync
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Click to sync now
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <p className="font-medium">All Synced</p>
        {lastSyncTime ? (
          <p className="text-xs text-muted-foreground">
            Last saved: {formatLastSaved(lastSyncTime)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">All changes are saved</p>
        )}
      </div>
    );
  };

  const statusLabel =
    isSyncing
      ? "Syncing..."
      : !isOnline
        ? "Offline"
        : pendingCount > 0
          ? `${pendingCount} pending`
          : lastSyncTime
            ? `Saved ${formatLastSaved(lastSyncTime)}`
            : "Synced";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSync}
            disabled={isSyncing || !isOnline}
            aria-label={`Sync status: ${statusLabel}`}
            className="relative size-9 w-auto min-w-9 px-2 disabled:opacity-100"
          >
            {getStatusIcon()}
            <span className="hidden text-sm text-muted-foreground tabular-nums md:inline">
              {statusLabel}
            </span>
            {pendingCount > 0 && !isSyncing && (
              <span
                aria-hidden
                className={cn(
                  "absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full px-1 py-0.5 text-xs leading-none font-semibold tabular-nums text-white ring-2 ring-background md:hidden",
                  hasErrors || !isOnline ? "bg-red-600" : "bg-amber-500"
                )}
              >
                {pendingCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" sideOffset={6} className="max-w-[220px]">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
