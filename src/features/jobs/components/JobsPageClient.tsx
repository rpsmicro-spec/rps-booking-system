"use client";

import { useState } from "react";
import { JobsTable } from "./JobsTable";
import { JobSearch } from "./JobSearch";
import { JobFilters } from "./JobFilters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Settings, Briefcase } from "lucide-react";
import { JobNumberSettingsDialog } from "./JobNumberSettingsDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { RecentJobs } from "./RecentJobs";
import { PullToSearch } from "@/components/pwa/PullToSearch";

export function JobsPageClient() {
  const isMobile = useIsMobile();
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
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
          
          <JobSearch
            search={search}
            onSearchChange={handleSearchChange}
            onClear={handleClearSearch}
          />
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
          />

          <Card>
            <CardHeader>
              <CardTitle>All Jobs</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              <JobsTable
                status={status}
                search={search}
                dateFrom={dateFrom}
                dateTo={dateTo}
                limit={limit}
                offset={offset}
                onTotalChange={setTotal}
              />
            </CardContent>
          </Card>

          {/* Pagination */}
          {total > limit && (
            <div className="flex flex-col gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Showing {offset + 1}-{Math.min(offset + limit, total)} of{" "}
                {total} jobs
              </p>
              <Pagination>
                <PaginationContent className="flex-wrap">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (offset > 0) {
                          setOffset(Math.max(0, offset - limit));
                        }
                      }}
                      className={
                        offset === 0
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {(() => {
                    const totalPages = Math.ceil(total / limit);
                    const currentPage = Math.floor(offset / limit) + 1;
                    const pages: (number | "ellipsis")[] = [];

                    // On mobile, show fewer page numbers
                    const maxPagesToShow = isMobile ? 3 : 7;

                    if (totalPages <= maxPagesToShow) {
                      // Show all pages
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Show first page
                      pages.push(1);

                      if (currentPage <= 4) {
                        // Show pages 2-5, then ellipsis, then last
                        const endPage = maxPagesToShow === 3 ? 3 : 5;
                        for (let i = 2; i <= endPage; i++) {
                          pages.push(i);
                        }
                        if (maxPagesToShow > 3) {
                          pages.push("ellipsis");
                          pages.push(totalPages);
                        }
                      } else if (currentPage >= totalPages - 3) {
                        // Show first, ellipsis, then last pages
                        if (maxPagesToShow > 3) {
                          pages.push("ellipsis");
                        }
                        const startPage = maxPagesToShow === 3 
                          ? Math.max(2, totalPages - 1)
                          : totalPages - 4;
                        for (let i = startPage; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Show first, ellipsis, current-1, current, current+1, ellipsis, last
                        if (maxPagesToShow > 3) {
                          pages.push("ellipsis");
                        }
                        for (
                          let i = currentPage - 1;
                          i <= currentPage + 1;
                          i++
                        ) {
                          pages.push(i);
                        }
                        if (maxPagesToShow > 3) {
                          pages.push("ellipsis");
                          pages.push(totalPages);
                        }
                      }
                    }

                    return pages.map((page, index) => {
                      if (page === "ellipsis") {
                        return (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setOffset((page - 1) * limit);
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer text-xs sm:text-sm min-w-[2rem] sm:min-w-[2.5rem]"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    });
                  })()}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (offset + limit < total) {
                          setOffset(offset + limit);
                        }
                      }}
                      className={
                        offset + limit >= total
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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
