import { requireAuth } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { JobDetailClient } from "@/features/jobs/components/JobDetailClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Edit, Hash, Calendar, Package, Truck } from "lucide-react";
import { DeleteJobDialog } from "@/features/jobs/components/DeleteJobDialog";
import { getSignedUrl } from "@/lib/storage/signed-url";
import { STATUS_LABELS, getStatusBadgeCustomClasses } from "@/lib/constants";
import type { JobStatus } from "@/types/types";
import { CustomerDetailsDialog } from "@/features/jobs/components/CustomerDetailsDialog";

const STATUS_ICONS: Record<string, typeof Calendar> = {
  collected: Calendar,
  in_progress: Package,
  completed: Package,
  delivered: Truck,
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const supabase = await createClient();
  const { id } = await params;

  // Fetch job and status history in parallel
  const [jobResult, statusHistoryResult] = await Promise.all([
    supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("job_status_history")
      .select("*")
      .eq("job_id", id)
      .order("changed_at", { ascending: true }),
  ]);

  const { data: job, error } = jobResult;
  const { data: statusHistory } = statusHistoryResult;

  if (error || !job) {
    notFound();
  }

  // Generate signed URL for invoice if it exists (private bucket)
  let invoiceUrl: string | null = null;
  if (job.invoice_file_path) {
    invoiceUrl = await getSignedUrl(job.invoice_file_path, "invoices", 3600); // 1 hour expiry
  }

  // Pass signed URL to component
  const jobWithSignedInvoice = {
    ...job,
    invoice_file_path: invoiceUrl,
  };

  const StatusIcon = job.status
    ? STATUS_ICONS[job.status] || Hash
    : Hash;

  return (
    <div className="flex-1 space-y-4">
      {/* Top Row: Job Number with Dynamic Icon, Status Badge, and Edit/Delete Buttons */}
      <div className="flex flex-col gap-3 sm:gap-4 pt-2 md:pt-4">
        {/* Job Number and Badge Row */}
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <StatusIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{job.job_number}</h1>
          </div>
          {job.status && (
            <Badge
              className={`${getStatusBadgeCustomClasses(job.status as JobStatus)} shrink-0 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 font-semibold`}
            >
              {STATUS_LABELS[job.status as JobStatus] || "Unknown"}
            </Badge>
          )}
        </div>
        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <CustomerDetailsDialog job={jobWithSignedInvoice} />
          <Link href={`/jobs/${id}/edit`}>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Edit className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Edit
            </Button>
          </Link>
          <DeleteJobDialog jobId={job.id} jobNumber={job.job_number} />
        </div>
      </div>

      {/* Status Card */}
      <JobDetailClient
        job={jobWithSignedInvoice}
        statusHistory={statusHistory || []}
        showStatusCard={true}
      />
      
      {/* Rest of the content */}
      <JobDetailClient
        job={jobWithSignedInvoice}
        originalJob={job}
        statusHistory={statusHistory || []}
        showStatusCard={false}
      />
    </div>
  );
}
