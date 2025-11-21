"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, WifiOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // Check internet connection by verifying service health
  // Checks multiple services we depend on: Supabase, Resend, and general connectivity
  const checkInternetConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }

    const createTimeoutSignal = (ms: number) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), ms);
      return controller.signal;
    };

    const checks: Promise<boolean>[] = [];

    // Check 1: Our own API (Supabase-backed) - Primary check
    checks.push(
      fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
        signal: createTimeoutSignal(2000),
      })
        .then((res) => res.ok || res.status < 500)
        .catch(() => false)
    );

    // Check 2: Supabase REST API health (if not local)
    // Supabase REST API returns 200 even without auth for health checks
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (
      supabaseUrl &&
      !supabaseUrl.includes("127.0.0.1") &&
      !supabaseUrl.includes("localhost")
    ) {
      checks.push(
        fetch(`${supabaseUrl}/rest/v1/`, {
          method: "HEAD",
          cache: "no-store",
          signal: createTimeoutSignal(2000),
        })
          .then((res) => res.ok || res.status < 500)
          .catch(() => false)
      );
    }

    // Check 3: Resend API status (via their status page API if available)
    // Resend uses status.resend.com but we can check their main domain
    // This is a secondary check to verify Resend service availability
    checks.push(
      fetch("https://api.resend.com/health", {
        method: "GET",
        cache: "no-store",
        signal: createTimeoutSignal(2000),
      })
        .then((res) => res.ok)
        .catch(() => {
          // If health endpoint doesn't exist, try their main API root
          return fetch("https://api.resend.com", {
            method: "HEAD",
            cache: "no-store",
            signal: createTimeoutSignal(2000),
          })
            .then((res) => res.ok || res.status === 401) // 401 means API is reachable
            .catch(() => false);
        })
    );

    // Check 4: General internet connectivity (Cloudflare DNS)
    // This is a fallback to verify basic internet access
    checks.push(
      fetch("https://cloudflare.com", {
        method: "HEAD",
        cache: "no-store",
        signal: createTimeoutSignal(2000),
      })
        .then((res) => res.ok)
        .catch(() => false)
    );

    try {
      // If any check passes, we're online
      // This ensures we're connected if at least one service is reachable
      const results = await Promise.allSettled(checks);
      const anyOnline = results.some(
        (result) => result.status === "fulfilled" && result.value === true
      );
      setIsOnline(anyOnline);
    } catch {
      // If all checks fail, fall back to navigator.onLine
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

    // Initial connection check
    checkInternetConnection();

    // Load pending jobs
    loadPendingJobs();

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", () => setIsOnline(false));

    // Poll for connection and pending jobs every 15 seconds
    const interval = setInterval(() => {
      checkInternetConnection();
      loadPendingJobs();
    }, 15000);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", () => setIsOnline(false));
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || !isOnline}
            className={cn(
              "h-8 px-2 gap-1.5 min-w-auto",
              "hover:bg-accent/50",
              !isOnline && "text-orange-500",
              pendingJobs.length > 0 &&
                isOnline &&
                !isSyncing &&
                "text-yellow-500",
              isOnline &&
                pendingJobs.length === 0 &&
                !isSyncing &&
                "text-green-500",
              isSyncing && "text-blue-500"
            )}
          >
            {getStatusIcon()}
            <span className="text-xs font-medium hidden sm:inline">
              {isSyncing
                ? "Syncing..."
                : !isOnline
                  ? "Offline"
                  : pendingJobs.length > 0
                    ? `${pendingJobs.length} pending`
                    : lastSyncTime
                      ? `Saved ${formatLastSaved(lastSyncTime)}`
                      : "Synced"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px]">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
