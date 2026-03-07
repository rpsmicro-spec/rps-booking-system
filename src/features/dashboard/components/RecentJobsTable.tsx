"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Briefcase } from "lucide-react";
import type { Job, JobStatus } from "@/types/types";
import { format } from "date-fns";
import {
  utcToIstDateObject,
  getIstTodayStart,
  getIstWeekStart,
} from "@/lib/utils/date-ist";
import { STATUS_LABELS, getStatusBadgeCustomClasses } from "@/lib/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { JobCardMobile } from "@/features/jobs/components/JobCardMobile";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type TimeRange = "today" | "week";

function filterJobsByTimeRange(jobList: Job[], range: TimeRange): Job[] {
  let filterDate: Date;
  if (range === "today") {
    filterDate = new Date(getIstTodayStart());
  } else {
    filterDate = new Date(getIstWeekStart());
  }
  return jobList.filter((job) => {
    if (!job.created_at) return false;
    return new Date(job.created_at) >= filterDate;
  });
}

type RecentJobsTableProps = {
  /** Server-provided recent jobs (e.g. from dashboard). When set, used as initial data and no fetch on mount. */
  initialJobs?: Job[];
};

export function RecentJobsTable({ initialJobs }: RecentJobsTableProps = {}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState<Job[]>(() => {
    if (initialJobs?.length) {
      return filterJobsByTimeRange(initialJobs, "week").slice(0, 5);
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(!initialJobs?.length);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  useEffect(() => {
    if (initialJobs?.length) {
      const filtered = filterJobsByTimeRange(initialJobs, timeRange).slice(0, 5);
      setJobs(filtered);
      setIsLoading(false);
      return;
    }
    fetchRecentJobs(timeRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialJobs is server-provided, stable per request
  }, [timeRange]);

  const fetchRecentJobs = async (range: TimeRange) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/jobs?limit=50`);
      const result = await response.json();

      if (!response.ok) {
        setError("Failed to load recent jobs");
        return;
      }

      const recentJobs = filterJobsByTimeRange(result.jobs || [], range).slice(
        0,
        5
      );
      setJobs(recentJobs);
    } catch (error) {
      console.error("Error fetching recent jobs:", error);
      setError("Failed to load recent jobs. Please check your connection.");
      toast.error("Failed to load recent jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeRangeChange = (value: string) => {
    const newRange = value as TimeRange;
    setTimeRange(newRange);
    const message =
      newRange === "today"
        ? "Showing jobs from today"
        : "Showing jobs from this week";
    toast.info(message, { duration: 2000 });
  };

  const handleRowClick = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  if (isLoading) {
    return isMobile ? (
      <div className="space-y-4">
        {/* Time Range Tabs Skeleton */}
        <div className="w-full grid grid-cols-2 gap-2">
          <div className="h-10 bg-muted rounded-md animate-pulse"></div>
          <div className="h-10 bg-muted rounded-md animate-pulse"></div>
        </div>
        {/* Cards Skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-5 bg-muted rounded-full w-16 shrink-0"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    ) : (
      <TableSkeleton rows={5} columns={5} />
    );
  }

  if (error) {
    return (
      <div className="p-8 sm:p-12 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchRecentJobs(timeRange)}>
          Try Again
        </Button>
      </div>
    );
  }

  const emptyState = isMobile ? (
    <div className="py-8 px-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle className="text-base">
            No jobs found {timeRange === "today" ? "today" : "this week"}
          </EmptyTitle>
          <EmptyDescription className="text-sm">
            Create a new job to get started
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  ) : (
    <div className="p-8 sm:p-12">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Briefcase className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>
            No jobs found {timeRange === "today" ? "today" : "this week"}.
          </EmptyTitle>
          <EmptyDescription>Create a new job to get started.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Time Range Tabs with Count */}
        <div className="space-y-2">
          <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
            <TabsList className="w-full grid grid-cols-2 h-10">
              <TabsTrigger value="today" className="text-sm font-medium">
                Today
                {jobs.length > 0 && timeRange === "today" && (
                  <span className="ml-1.5 text-xs font-normal opacity-70">
                    ({jobs.length})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="week" className="text-sm font-medium">
                This Week
                {jobs.length > 0 && timeRange === "week" && (
                  <span className="ml-1.5 text-xs font-normal opacity-70">
                    ({jobs.length})
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          emptyState
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCardMobile
                key={job.id}
                job={job}
                onCardClick={handleRowClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="space-y-4">
      <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
        <TabsList className="w-fit">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Booking Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(job.id)}
                >
                  <TableCell className="font-medium">
                    {job.job_number}
                  </TableCell>
                  <TableCell>{job.customer_name}</TableCell>
                  <TableCell>
                    <Badge
                      className={getStatusBadgeCustomClasses(
                        job.status as JobStatus
                      )}
                    >
                      {job.status
                        ? STATUS_LABELS[job.status as JobStatus] || "Unknown"
                        : "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {job.booking_date
                      ? (() => {
                          const istDate = utcToIstDateObject(job.booking_date);
                          return istDate
                            ? format(istDate, "MMM dd, yyyy")
                            : "-";
                        })()
                      : "-"}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/jobs/${job.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
