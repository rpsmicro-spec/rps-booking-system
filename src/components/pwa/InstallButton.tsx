"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { toast } from "sonner";

export function InstallButton() {
  const { install, deferredPrompt, canInstall, isInstalled } = usePWAInstall();
  // Initialize as false to match server render, then update after mount
  const [isStandalone, setIsStandalone] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Only check client-side values after mount to prevent hydration mismatch
  // This pattern prevents hydration mismatches by ensuring server and client render the same initially
  // Note: We intentionally set state in useEffect to defer client-side checks until after hydration
  useEffect(() => {
    // Use setTimeout to defer state update and avoid hydration mismatch
    const timer = setTimeout(() => {
      setIsClient(true);

      // Check if app is already installed (standalone mode)
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;

      setIsStandalone(standalone);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Don't render anything until client-side hydration is complete
  // This ensures server and client render the same initially (null)
  if (!isClient) {
    return null;
  }

  // Hide if already installed or in standalone mode
  if (isInstalled || isStandalone) {
    return null;
  }

  // Show button if canInstall is true (hook handles optimistic display during checking)
  if (!canInstall) {
    return null;
  }

  const handleInstall = async () => {
    // Try to use the deferred prompt if available
    if (deferredPrompt) {
      const success = await install();
      if (success) {
        toast.success("App installed successfully!");
      } else {
        toast.error("Installation was cancelled or failed");
      }
    } else {
      // If no deferred prompt (browser banner might have consumed it), show instructions
      toast.info(
        'Please use your browser\'s menu to install this app. Look for "Install" or "Add to Home Screen" option.',
        { duration: 5000 }
      );
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleInstall}
      className="gap-2 shrink-0"
      title="Install app on your device"
    >
      <Download className="h-4 w-4 shrink-0" />
      <span className="hidden md:inline">Install App</span>
    </Button>
  );
}
