import { createClient } from "@/lib/supabase/server";
import { RecentJobsTable } from "@/features/dashboard/components/RecentJobsTable";
import type { Job } from "@/types/types";

/**
 * Async server component: fetches recent jobs and passes as initial data to avoid client waterfall.
 */
export async function DashboardRecentJobsContent() {
  const supabase = await createClient();

  const { data: recentJobs } = await supabase
    .from("jobs")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const jobs = (recentJobs ?? []) as Job[];

  return (
    <div className="space-y-4">
      <h3 className="text-lg md:text-xl font-semibold tracking-tight">
        Recent Jobs
      </h3>
      <RecentJobsTable initialJobs={jobs} />
    </div>
  );
}
