"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null | undefined = null;

    const checkForUpdates = async () => {
      try {
        registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        // Check for updates periodically
        await registration.update();

        // Listen for new service worker
        registration.addEventListener("updatefound", () => {
          const newWorker = registration?.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker is ready
              setUpdateAvailable(true);
              showUpdateNotification();
            }
          });
        });

        // Check if there's already a waiting service worker
        if (registration.waiting) {
          setUpdateAvailable(true);
          showUpdateNotification();
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
      }
    };

    const handleUpdate = async () => {
      if (!registration || !registration.waiting) {
        // Force reload if no waiting worker
        window.location.reload();
        return;
      }

      setIsUpdating(true);

      // Tell the waiting service worker to skip waiting and activate
      registration.waiting.postMessage({ type: "SKIP_WAITING" });

      // Wait a moment for the service worker to activate
      setTimeout(() => {
        window.location.reload();
      }, 100);
    };

    const startAutoReload = () => {
      // Clear any existing countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      let seconds = 10;
      setCountdown(seconds);

      countdownIntervalRef.current = setInterval(() => {
        seconds -= 1;
        setCountdown(seconds);

        if (seconds <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          handleUpdate();
        }
      }, 1000);
    };

    const showUpdateNotification = () => {
      // Show toast notification
      toast.info("New version available!", {
        description: "A new version of the app is ready. Click to update.",
        duration: 10000,
        action: {
          label: "Update Now",
          onClick: () => handleUpdate(),
        },
        onDismiss: () => {
          // Start countdown if dismissed
          startAutoReload();
        },
      });
    };

    // Initial check
    checkForUpdates();

    // Check for updates every 30 minutes
    const updateInterval = setInterval(checkForUpdates, 30 * 60 * 1000);

    // Listen for controller change (service worker activated)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Service worker has been updated, reload to get new version
      if (!isUpdating) {
        window.location.reload();
      }
    });

    return () => {
      clearInterval(updateInterval);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isUpdating]);

  const handleDismiss = () => {
    setUpdateAvailable(false);
    setCountdown(null);
    // Clear any running countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleUpdateClick = async () => {
    if (countdown) {
      // Cancel auto-reload
      setCountdown(null);
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !registration.waiting) {
      // Force reload if no waiting worker
      window.location.reload();
      return;
    }

    setIsUpdating(true);

    // Tell the waiting service worker to skip waiting and activate
    registration.waiting.postMessage({ type: "SKIP_WAITING" });

    // Wait a moment for the service worker to activate
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-background border rounded-lg shadow-lg p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <RefreshCw className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Update Available</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {countdown !== null
                  ? `Reloading in ${countdown} seconds...`
                  : "A new version of the app is ready to install."}
              </p>
            </div>
          </div>
          {countdown === null && (
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleUpdateClick}
            size="sm"
            className="flex-1"
            disabled={isUpdating}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 mr-2", isUpdating && "animate-spin")}
            />
            {isUpdating ? "Updating..." : "Update Now"}
          </Button>
          {countdown !== null && (
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              disabled={isUpdating}
            >
              Cancel
            </Button>
          )}
        </div>
        {countdown !== null && (
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${((10 - countdown) / 10) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
