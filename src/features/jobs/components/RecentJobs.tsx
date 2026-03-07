"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { offlineStorage, type RecentJob } from "@/lib/offline/storage";

function formatViewedAt(viewedAt: number): string {
  const date = new Date(viewedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

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
    <section
      className="rounded-xl border border-border/80 bg-muted/30 dark:bg-muted/20 overflow-hidden"
      aria-label="Recently viewed jobs"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Recent Jobs
            </h3>
            <p className="text-xs text-muted-foreground">
              Recently viewed
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearRecent}
          className="h-8 px-2.5 text-xs -mr-1"
          aria-label="Clear recent jobs"
        >
          <X className="h-3.5 w-3 mr-1.5" />
          Clear
        </Button>
      </div>
      <ul className="divide-y divide-border/50">
        {recentJobs.map((job) => (
          <li key={job.jobId}>
            <Link
              href={`/jobs/${job.jobId}`}
              className="flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 active:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {job.jobNumber}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {job.customerName}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatViewedAt(job.viewedAt)}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/70" aria-hidden />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

