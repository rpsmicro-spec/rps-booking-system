"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, X } from "lucide-react";
import Link from "next/link";
import { offlineStorage, type RecentJob } from "@/lib/offline/storage";
export function RecentJobs() {
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentJobs();
  }, []);

  const loadRecentJobs = async () => {
    try {
      await offlineStorage.init();
      const jobs = await offlineStorage.getRecentJobs(5);
      setRecentJobs(jobs);
    } catch (error) {
      console.error("Error loading recent jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearRecent = async () => {
    try {
      await offlineStorage.clearRecentJobs();
      setRecentJobs([]);
    } catch (error) {
      console.error("Error clearing recent jobs:", error);
    }
  };

  if (loading) {
    return null;
  }

  if (recentJobs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Jobs
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearRecent}
            className="h-7 px-2.5 text-xs"
          >
            <X className="h-3 w-3 mr-1.5" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {recentJobs.map((job) => (
            <Link
              key={job.jobId}
              href={`/jobs/${job.jobId}`}
              className="block p-3 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/20 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {job.jobNumber}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {job.customerName}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground ml-3 shrink-0">
                  {new Date(job.viewedAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

