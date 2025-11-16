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
import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { JobNumberSettingsDialog } from "./JobNumberSettingsDialog";

export function JobsPageClient() {
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;

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
    <>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
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
              <Link href="/jobs/new">
                <Button className="hidden sm:flex">
                  <Plus className="mr-2 h-4 w-4" />
                  New Job
                </Button>
              </Link>
              <Link href="/jobs/new">
                <Button size="icon" className="sm:hidden">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">New Job</span>
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage and track all your job orders, from collection to delivery.
          </p>
        </div>

        <div className="space-y-4">
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
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Showing {offset + 1}-{Math.min(offset + limit, total)} of{" "}
                {total} jobs
              </p>
              <Pagination>
                <PaginationContent>
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

                    if (totalPages <= 7) {
                      // Show all pages
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Show first page
                      pages.push(1);

                      if (currentPage <= 4) {
                        // Show pages 2-5, then ellipsis, then last
                        for (let i = 2; i <= 5; i++) {
                          pages.push(i);
                        }
                        pages.push("ellipsis");
                        pages.push(totalPages);
                      } else if (currentPage >= totalPages - 3) {
                        // Show first, ellipsis, then last 5 pages
                        pages.push("ellipsis");
                        for (let i = totalPages - 4; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Show first, ellipsis, current-1, current, current+1, ellipsis, last
                        pages.push("ellipsis");
                        for (
                          let i = currentPage - 1;
                          i <= currentPage + 1;
                          i++
                        ) {
                          pages.push(i);
                        }
                        pages.push("ellipsis");
                        pages.push(totalPages);
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
                            className="cursor-pointer"
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
    </>
  );
}
