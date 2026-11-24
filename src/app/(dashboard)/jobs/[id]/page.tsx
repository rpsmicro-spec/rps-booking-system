import { requireAuth } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getSignedUrl } from "@/lib/storage/signed-url";
import type { JobStatus } from "@/types/types";
import { ClientOnly } from "@/components/client-only";
import { JobDetailPageContent } from "@/features/jobs/components/JobDetailPageContent";
import { JobDetailPageSkeleton } from "@/features/jobs/components/JobDetailPageSkeleton";
import { JobDetailHeader } from "@/features/jobs/components/JobDetailHeader";

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
    <div className="flex-1 space-y-4 md:space-y-6">
      {/* Top Row: Job Number with Dynamic Icon, Status Badge, and Edit/Delete Buttons */}
      <div className="flex flex-col gap-3 sm:gap-4 pt-1 md:pt-2">
        {/* Job Number and Badge Row */}
        <JobDetailHeader
          jobId={job.id}
          jobNumber={job.job_number}
          serverStatus={(job.status as JobStatus) ?? null}
        />
        {/* Action buttons + detail content: client-only to avoid Radix hydration mismatch */}
        <ClientOnly fallback={<JobDetailPageSkeleton />}>
          <JobDetailPageContent
            id={id}
            jobWithSignedInvoice={jobWithSignedInvoice}
            originalJob={job}
            statusHistory={statusHistory || []}
          />
        </ClientOnly>
      </div>
    </div>
  );
}
