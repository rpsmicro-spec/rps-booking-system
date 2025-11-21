"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncOfflineJobs } from "@/lib/offline/sync";
import { offlineStorage } from "@/lib/offline/storage";
import { toast } from "sonner";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [pendingJobsCount, setPendingJobsCount] = useState(0);

  const loadPendingJobsCount = async () => {
    try {
      await offlineStorage.init();
      const pending = await offlineStorage.getPendingJobs();
      setPendingJobsCount(pending.length);
    } catch (error) {
      console.error("Error loading pending jobs:", error);
    }
  };

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Load pending jobs count - defer to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      void loadPendingJobsCount();
    }, 0);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      // Sync when coming online
      void syncOfflineJobs().then(() => {
        // Defer state update to avoid synchronous setState in effect
        setTimeout(() => {
          void loadPendingJobsCount();
        }, 0);
      });
    } else {
      // Defer state update to avoid synchronous setState in effect
      setTimeout(() => {
        void loadPendingJobsCount();
      }, 0);
    }
  }, [isOnline]);

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error("You're currently offline. Please check your connection.");
      return;
    }

    toast.info("Syncing offline jobs...");
    await syncOfflineJobs();
    await loadPendingJobsCount();
  };

  if (isOnline && pendingJobsCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card border rounded-lg shadow-lg p-3 space-y-2 min-w-[200px]">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Offline</span>
            </>
          )}
        </div>
        {pendingJobsCount > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {pendingJobsCount} job{pendingJobsCount > 1 ? "s" : ""} pending sync
            </p>
            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualSync}
                className="w-full text-xs"
              >
                Sync Now
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

