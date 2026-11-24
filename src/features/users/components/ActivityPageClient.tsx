"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Activity as ActivityIcon, SearchX } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityFilters } from "./ActivityFilters";
import { ActivityFeedItem } from "./ActivityFeedItem";
import { type AuditLog, formatDayHeading, groupByDay } from "./activity-format";

const PAGE_SIZE = 20;

function FeedSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading activity">
      {[3, 2].map((count, g) => (
        <section key={g} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="rounded-xl border bg-card divide-y">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex gap-3 px-3 py-3 md:px-4">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2 pt-1">
                  <div className="flex gap-3">
                    <Skeleton className="h-4 flex-1 max-w-80" />
                    <Skeleton className="ml-auto h-3 w-10 shrink-0" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ActivityPageClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rawId, setRawId] = useState<string | null>(null);

  // Filters are applied server-side; changing one restarts from page 1.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFrom, dateTo, action]);

  useEffect(() => {
    // Debounce search keystrokes and abort superseded requests so a slow
    // older response can't overwrite the results of a newer one.
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => fetchAuditLogs(controller.signal),
      search ? 300 : 0,
    );
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dateFrom, dateTo, action, currentPage]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;

  const fetchAuditLogs = async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (action) params.append("action", action);
      params.append("limit", PAGE_SIZE.toString());
      params.append("offset", ((currentPage - 1) * PAGE_SIZE).toString());

      const response = await fetch(`/api/audit-log?${params.toString()}`, {
        signal,
      });
      const result = await response.json();

      if (!response.ok) {
        console.error(result.error || "Failed to fetch audit logs");
        return;
      }

      const newTotal = result.total || 0;
      setLogs(result.logs || []);
      setTotal(newTotal);
      // Clamp the page if the total shrank under us (e.g. filters narrowed
      // while sitting on a late page).
      const lastPage = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      if (currentPage > lastPage) {
        setCurrentPage(lastPage);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("An unexpected error occurred", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSearch("");
    setDateFrom(null);
    setDateTo(null);
    setAction(null);
  };

  const hasFilters = !!(search || dateFrom || dateTo || action);
  const groups = useMemo(() => groupByDay(logs), [logs]);

  const emptyState = (
    <div className="rounded-xl border border-dashed p-8 sm:p-12">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {hasFilters ? <SearchX className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
          </EmptyMedia>
          <EmptyTitle>{hasFilters ? "No matching activity" : "No activity yet"}</EmptyTitle>
          <EmptyDescription>
            {hasFilters
              ? "Nothing matches these filters. Try a different search or date range."
              : "No system activity has been recorded yet. Activity will appear here as users interact with the system."}
          </EmptyDescription>
        </EmptyHeader>
        {hasFilters && (
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear filters
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </div>
  );

  return (
    <div className="flex-1 space-y-4 md:space-y-6">
      <PageHeader
        icon={ActivityIcon}
        title="Activity Log"
        description="View and track all system activities and user actions."
      />

      <div>
        <ActivityFilters
          search={search}
          dateFrom={dateFrom}
          dateTo={dateTo}
          action={action}
          onSearchChange={setSearch}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onActionChange={setAction}
          onClear={handleClear}
        />
      </div>

      {isLoading ? (
        <FeedSkeleton />
      ) : logs.length === 0 ? (
        emptyState
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.day} aria-labelledby={`activity-day-${group.day}`}>
              <h2
                id={`activity-day-${group.day}`}
                className="sticky top-0 z-10 -mx-3 bg-background/95 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80 md:mx-0 md:px-1"
              >
                {group.day === "unknown" ? "Unknown date" : formatDayHeading(group.day)}
              </h2>
              <ul className="divide-y rounded-xl border bg-card">
                {group.logs.map((log) => (
                  <ActivityFeedItem
                    key={log.id}
                    log={log}
                    expanded={expandedId === log.id}
                    onExpandedChange={(open) => {
                      setExpandedId(open ? log.id : null);
                      if (!open) setRawId(null);
                    }}
                    showRaw={rawId === log.id}
                    onShowRawChange={(show) => setRawId(show ? log.id : null)}
                  />
                ))}
              </ul>
            </section>
          ))}

          {total > PAGE_SIZE && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground tabular-nums">
                Showing {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total} activities
              </p>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-0 sm:flex-initial"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-0 sm:flex-initial"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
