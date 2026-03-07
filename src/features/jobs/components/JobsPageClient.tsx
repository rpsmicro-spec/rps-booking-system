"use client";

import { useState } from "react";
import { JobsTable } from "./JobsTable";
import { JobSearch } from "./JobSearch";
import { JobFilters } from "./JobFilters";
import { Button } from "@/components/ui/button";
import { Settings, Briefcase, Filter } from "lucide-react";
import { JobNumberSettingsDialog } from "./JobNumberSettingsDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { RecentJobs } from "./RecentJobs";
import { PullToSearch } from "@/components/pwa/PullToSearch";

export function JobsPageClient() {
  const isMobile = useIsMobile();
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const handleStatusChange = (newStatus: string | null) => {
    setStatus(newStatus);
    setOffset(0);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setOffset(0);
  };

  const handleClearFilters = () => {
    setStatus(null);
    setDateFrom(null);
    setDateTo(null);
    setOffset(0);
  };

  const handleClearSearch = () => {
    setSearch("");
    setOffset(0);
  };

  return (
    <PullToSearch>
      <div className="flex-1 space-y-6">
        <div className="flex flex-col gap-2 pt-2 md:pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Jobs</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSettingsDialogOpen(true)}
                title="Job Number Settings"
                className="hidden sm:flex"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage and track all your job orders, from collection to delivery.
          </p>
        </div>

        <div className="space-y-4">
          {/* Recent Jobs - Show on mobile or when no filters/search */}
          {(isMobile || (!search && !status && !dateFrom && !dateTo)) && (
            <RecentJobs />
          )}

          <JobFilters
            status={status}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onStatusChange={handleStatusChange}
            onDateFromChange={(date) => {
              setDateFrom(date);
              setOffset(0);
            }}
            onDateToChange={(date) => {
              setDateTo(date);
              setOffset(0);
            }}
            onClear={handleClearFilters}
            mobileSheetOpen={filterSheetOpen}
            onMobileSheetOpenChange={setFilterSheetOpen}
            search={search}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
          />

          <div className="space-y-4">
            <h3 className="text-lg md:text-xl font-semibold tracking-tight">
              All Jobs
            </h3>
            {/* Mobile only: search + filter button in one row */}
            <div className="flex gap-2 items-center md:hidden">
              <div className="flex-1 min-w-0">
                <JobSearch
                  search={search}
                  onSearchChange={handleSearchChange}
                  onClear={handleClearSearch}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setFilterSheetOpen(true)}
                aria-label="Open filters"
                title="Filters"
              >
                <Filter className="h-4 w-4" />
                {(status || dateFrom || dateTo) && (
                  <span className="sr-only">
                    ({[status, dateFrom, dateTo].filter(Boolean).length} active)
                  </span>
                )}
              </Button>
            </div>
            <div className="min-h-[400px]">
              <JobsTable
                status={status}
                search={search}
                dateFrom={dateFrom}
                dateTo={dateTo}
                limit={limit}
                offset={offset}
                onTotalChange={setTotal}
              />
            </div>
          </div>

          {/* Pagination - same UI as Activity page */}
          {total > limit && (
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} jobs
              </p>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-0 sm:flex-initial"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-0 sm:flex-initial"
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <JobNumberSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />
    </PullToSearch>
  );
}
