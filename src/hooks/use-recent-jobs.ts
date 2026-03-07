"use client";

import { useEffect } from "react";
import { offlineStorage } from "@/lib/offline/storage";

/**
 * Hook to track when a job is viewed
 * Call this in job detail pages to track recent jobs
 */
export function useRecentJobs(jobId?: string, jobNumber?: string, customerName?: string) {
  useEffect(() => {
    if (jobId && jobNumber && customerName) {
      offlineStorage
        .init()
        .then(() => {
          offlineStorage.addRecentJob(jobId, jobNumber, customerName).catch((error) => {
            console.error("Error tracking recent job:", error);
          });
        })
        .catch((error) => {
          console.error("Error initializing offline storage:", error);
        });
    }
  }, [jobId, jobNumber, customerName]);
}
