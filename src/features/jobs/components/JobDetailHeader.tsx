"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, Hash, Package, Truck } from "lucide-react";
import { STATUS_LABELS, getStatusBadgeCustomClasses } from "@/lib/constants";
import type { JobStatus } from "@/types/types";
import { useEffectiveJobStatus } from "@/lib/jobs/status-overrides";

const STATUS_ICONS: Record<string, typeof Calendar> = {
  collected: Calendar,
  in_progress: Package,
  completed: Package,
  delivered: Truck,
};

/** Job number + status badge; follows optimistic status changes instantly. */
export function JobDetailHeader({
  jobId,
  jobNumber,
  serverStatus,
}: {
  jobId: string;
  jobNumber: string;
  serverStatus: JobStatus | null;
}) {
  const { status } = useEffectiveJobStatus(jobId, serverStatus as JobStatus);
  const shown = serverStatus ? status : null;
  const StatusIcon = (shown && STATUS_ICONS[shown]) || Hash;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <StatusIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground flex-shrink-0" />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight tabular-nums break-words">{jobNumber}</h1>
      </div>
      {shown && (
        <Badge
          className={`${getStatusBadgeCustomClasses(shown)} shrink-0 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 font-semibold`}
        >
          {STATUS_LABELS[shown] || "Unknown"}
        </Badge>
      )}
    </div>
  );
}
