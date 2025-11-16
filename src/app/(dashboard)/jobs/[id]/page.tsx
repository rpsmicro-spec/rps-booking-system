import { requireAuth } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { JobDetailClient } from "@/features/jobs/components/JobDetailClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit, Hash } from "lucide-react";
import { DeleteJobDialog } from "@/features/jobs/components/DeleteJobDialog";
import { getSignedUrl } from "@/lib/storage/signed-url";
import { StatusBadge } from "@/features/jobs/components/StatusBadge";
import type { JobStatus } from "@/types/types";
import { CustomerDetailsDialog } from "@/features/jobs/components/CustomerDetailsDialog";

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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Top Row: Job Number with # Icon, Status Badge, and Edit/Delete Buttons */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Hash className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-3xl font-bold">{job.job_number}</h1>
          {job.status && (
            <StatusBadge status={job.status as JobStatus} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <CustomerDetailsDialog job={jobWithSignedInvoice} />
          <Link href={`/jobs/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
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
