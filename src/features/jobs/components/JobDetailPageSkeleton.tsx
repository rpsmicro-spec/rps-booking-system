"use client";

/**
 * Placeholder shown while Radix-heavy job detail content mounts (avoids hydration mismatch).
 */
export function JobDetailPageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-9 w-24 rounded-md bg-muted" />
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="h-9 flex-1 max-w-[80px] rounded-md bg-muted" />
          <div className="h-9 flex-1 max-w-[90px] rounded-md bg-muted" />
        </div>
      </div>
      <div className="rounded-lg border bg-card p-4 md:p-6">
        <div className="h-5 w-32 rounded bg-muted mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full max-w-[200px] rounded bg-muted" />
          <div className="h-4 w-full max-w-[280px] rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      </div>
      <div className="rounded-lg border bg-card p-4 md:p-6">
        <div className="h-5 w-40 rounded bg-muted mb-4" />
        <div className="h-20 w-full rounded bg-muted" />
      </div>
    </div>
  );
}
