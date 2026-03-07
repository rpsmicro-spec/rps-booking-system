"use client";

import Link from "next/link";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobDetailClient } from "./JobDetailClient";
import { DeleteJobDialog } from "./DeleteJobDialog";
import { CustomerDetailsDialog } from "./CustomerDetailsDialog";
import type { Job } from "@/types/types";
import type { StatusHistory } from "./StatusTimeline";

interface JobDetailPageContentProps {
  id: string;
  jobWithSignedInvoice: Job;
  originalJob: Job;
  statusHistory: StatusHistory[];
}

/**
 * Client-only content that contains Radix UI (Dialog, Collapsible).
 * Rendered after mount via ClientOnly to avoid hydration mismatch with useId/aria-controls.
 */
export function JobDetailPageContent({
  id,
  jobWithSignedInvoice,
  originalJob,
  statusHistory,
}: JobDetailPageContentProps) {
  return (
    <div className="space-y-4">
      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-2">
        <CustomerDetailsDialog job={jobWithSignedInvoice} />
        <div className="flex w-full sm:w-auto gap-2 flex-1 min-w-0 sm:flex-initial">
          <Link href={`/jobs/${id}/edit`} className="flex-1 min-w-0 sm:flex-initial">
            <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
              <Edit className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Edit
            </Button>
          </Link>
          <DeleteJobDialog
            jobId={jobWithSignedInvoice.id}
            jobNumber={jobWithSignedInvoice.job_number}
            triggerClassName="flex-1 min-w-0 w-full sm:w-auto"
          />
        </div>
      </div>

      <JobDetailClient
        job={jobWithSignedInvoice}
        statusHistory={statusHistory}
        showStatusCard={true}
      />

      <JobDetailClient
        job={jobWithSignedInvoice}
        originalJob={originalJob}
        statusHistory={statusHistory}
        showStatusCard={false}
      />
    </div>
  );
}
