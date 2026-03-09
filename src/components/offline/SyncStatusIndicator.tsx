"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, WifiOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { syncOfflineJobs } from "@/lib/offline/sync";
import { offlineStorage, type OfflineJob } from "@/lib/offline/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingJobs, setPendingJobs] = useState<OfflineJob[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Check internet connection via our own API (same-origin, no CORS issues).
  // External checks (cloudflare.com, api.resend.com, supabase REST) were removed
  // because they always fail with CORS/401 errors from the browser.
  const checkInternetConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("/api/auth/session", {
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
      const pending = await offlineStorage.getPendingJobs();
      setPendingJobs(pending);
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

    // Poll for connection and pending jobs every 15 seconds
    const interval = setInterval(() => {
      checkInternetConnection();
      loadPendingJobs();
    }, 15000);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [loadPendingJobs, checkInternetConnection]);

  useEffect(() => {
    if (isOnline && pendingJobs.length > 0 && !isSyncing) {
      // Auto-sync when coming online (with a small delay to avoid race conditions)
      const timeoutId = setTimeout(() => {
        handleSync();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, pendingJobs.length, isSyncing, handleSync]);

  const getStatusIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />;
    }

    if (!isOnline) {
      return <WifiOff className="h-3.5 w-3.5 text-orange-500" />;
    }

    if (pendingJobs.length > 0) {
      const hasErrors = pendingJobs.some((job) => job.status === "error");
      if (hasErrors) {
        return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
      }
      return <RefreshCw className="h-3.5 w-3.5 text-yellow-500" />;
    }

    return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
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
            {pendingJobs.length > 0
              ? `${pendingJobs.length} job${pendingJobs.length !== 1 ? "s" : ""} will sync when connection is restored`
              : "Check your internet connection"}
          </p>
        </div>
      );
    }

    if (pendingJobs.length > 0) {
      const errorJobs = pendingJobs.filter((job) => job.status === "error");
      return (
        <div className="space-y-1">
          <p className="font-medium">Sync Pending</p>
          <p className="text-xs">
            {pendingJobs.length} job{pendingJobs.length !== 1 ? "s" : ""}{" "}
            waiting to sync
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
        : pendingJobs.length > 0
          ? `${pendingJobs.length} pending`
          : lastSyncTime
            ? `Saved ${formatLastSaved(lastSyncTime)}`
            : "Synced";

  const badgeVariant = "outline";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            asChild
            variant={badgeVariant}
            className={cn(
              "cursor-pointer gap-1.5 py-1.5 transition-colors hover:opacity-90",
              !isOnline && "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400",
              pendingJobs.length > 0 &&
                isOnline &&
                !isSyncing &&
                "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400",
              isOnline &&
                pendingJobs.length === 0 &&
                !isSyncing &&
                "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              isSyncing && "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400"
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing || !isOnline}
              className="h-auto gap-1.5 rounded-full bg-transparent px-2.5 py-0.5 hover:bg-transparent hover:opacity-90 min-w-0"
            >
              {getStatusIcon()}
              <span className="text-xs font-medium hidden sm:inline">
                {statusLabel}
              </span>
            </Button>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px]">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
