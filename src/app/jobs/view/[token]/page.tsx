import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicJobView } from "@/features/jobs/components/PublicJobView";
import Image from "next/image";
import { getSignedUrl } from "@/lib/storage/signed-url";

export default async function PublicJobViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Fetch job by public token (no auth required)
  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("public_token", token)
    .is("deleted_at", null)
    .single();

  if (error || !job) {
    notFound();
  }

  // Fetch status history for the job
  const { data: statusHistory } = await supabase
    .from("job_status_history")
    .select("*")
    .eq("job_id", job.id)
    .order("changed_at", { ascending: true });

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/Logo.png"
              alt="RPS Micro Electronics"
              width={48}
              height={48}
              className="object-contain rounded-full"
            />
            <div>
              <h1 className="text-xl font-bold">RPS Micro Electronics</h1>
              <p className="text-sm text-muted-foreground">
                Job Management System
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <PublicJobView
          job={jobWithSignedInvoice}
          statusHistory={statusHistory || []}
        />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto shrink-0">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} RPS Micro Electronics. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
