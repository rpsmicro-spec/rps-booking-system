import { requireAuth } from "@/lib/auth/helpers";
import { NewJobFormClient } from "@/features/jobs/components/NewJobFormClient";
import { NewJobPageClient } from "@/features/jobs/components/NewJobPageClient";

export default async function NewJobPage() {
  await requireAuth();

  return (
    <div className="flex-1 space-y-4 md:space-y-6">
      <NewJobPageClient />
      <NewJobFormClient />
    </div>
  );
}
