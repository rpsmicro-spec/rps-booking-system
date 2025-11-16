import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CheckCircle2, Clock } from "lucide-react";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { RecentJobsTable } from "@/features/dashboard/components/RecentJobsTable";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get job statistics
  const { data: allJobs } = await supabase
    .from("jobs")
    .select("id, status")
    .is("deleted_at", null);

  const totalJobs = allJobs?.length || 0;
  const activeJobs =
    allJobs?.filter(
      (job) => job.status === "collected" || job.status === "in_progress"
    ).length || 0;

  // Get jobs completed today by checking job_status_history
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const { data: completedTodayHistory } = await supabase
    .from("job_status_history")
    .select("job_id")
    .eq("new_status", "completed")
    .gte("changed_at", today.toISOString())
    .lte("changed_at", todayEnd.toISOString());

  // Get unique job IDs that were completed today
  const completedTodayJobIds = new Set(
    completedTodayHistory?.map((h) => h.job_id) || []
  );
  const completedToday = completedTodayJobIds.size;

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">All time jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              In progress or collected
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Today
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday}</div>
            <p className="text-xs text-muted-foreground">
              Jobs completed today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Recent Jobs (This Week)</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentJobsTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
