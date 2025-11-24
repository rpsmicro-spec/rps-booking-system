"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // next-pwa handles service worker registration automatically
    // This component is kept for backward compatibility but is disabled
    // If you need custom registration logic, set register: false in next.config.ts
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "development"
    ) {
      // Only handle updates in development if next-pwa is disabled
      // Check if service worker is already registered by next-pwa
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          console.log("Service Worker already registered by next-pwa");

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("New service worker available");
                }
              });
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SKIP_WAITING") {
          // Service worker is ready, reload
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}
