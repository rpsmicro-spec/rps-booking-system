import { createClient } from "@/lib/supabase/server";
import {
  getIstTodayStart,
  getIstTodayEnd,
  getIstWeekStart,
} from "@/lib/utils/date-ist";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Truck,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

/**
 * Async server component: fetches all dashboard stats in parallel (no waterfalls).
 */
export async function DashboardStatsContent() {
  const supabase = await createClient();

  const todayStart = getIstTodayStart();
  const todayEnd = getIstTodayEnd();
  const weekStart = new Date(getIstWeekStart());
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart);

  const [
    jobsResult,
    completedTodayResult,
    completedThisWeekResult,
    completedLastWeekResult,
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, status, created_at")
      .is("deleted_at", null),
    supabase
      .from("job_status_history")
      .select("job_id")
      .eq("new_status", "completed")
      .gte("changed_at", todayStart)
      .lte("changed_at", todayEnd),
    supabase
      .from("job_status_history")
      .select("job_id")
      .eq("new_status", "completed")
      .gte("changed_at", weekStart.toISOString()),
    supabase
      .from("job_status_history")
      .select("job_id")
      .eq("new_status", "completed")
      .gte("changed_at", lastWeekStart.toISOString())
      .lt("changed_at", lastWeekEnd.toISOString()),
  ]);

  const allJobs = jobsResult.data ?? [];
  const totalJobs = allJobs.length;
  const activeJobs = allJobs.filter(
    (job) => job.status === "collected" || job.status === "in_progress"
  ).length;
  const deliveredJobs = allJobs.filter((j) => j.status === "delivered").length;
  const completedJobs = allJobs.filter((j) => j.status === "completed").length;
  const activePercentage =
    totalJobs > 0 ? Math.round((activeJobs / totalJobs) * 100) : 0;
  const completionRate =
    totalJobs > 0
      ? Math.round(((completedJobs + deliveredJobs) / totalJobs) * 100)
      : 0;

  const completedToday = new Set(
    completedTodayResult.data?.map((h) => h.job_id) ?? []
  ).size;
  const completedThisWeek = new Set(
    completedThisWeekResult.data?.map((h) => h.job_id) ?? []
  ).size;
  const completedLastWeek = new Set(
    completedLastWeekResult.data?.map((h) => h.job_id) ?? []
  ).size;

  const jobsThisWeek = allJobs.filter(
    (job) => job.created_at && new Date(job.created_at) >= weekStart
  ).length;
  const jobsLastWeek = allJobs.filter(
    (job) =>
      job.created_at &&
      new Date(job.created_at) >= lastWeekStart &&
      new Date(job.created_at) < lastWeekEnd
  ).length;
  const wowChange =
    jobsLastWeek > 0
      ? Math.round(((jobsThisWeek - jobsLastWeek) / jobsLastWeek) * 100)
      : jobsThisWeek > 0
        ? 100
        : 0;
  const completionWowChange =
    completedLastWeek > 0
      ? Math.round(
          ((completedThisWeek - completedLastWeek) / completedLastWeek) * 100
        )
      : completedThisWeek > 0
        ? 100
        : 0;

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
      {/* Total Jobs */}
      <div className="aspect-square flex flex-col relative overflow-hidden rounded-lg border-2 border-blue-200/50 dark:border-blue-800/50 transition-all active:scale-[0.98] active:opacity-90 bg-linear-to-br from-blue-50/60 to-blue-100/40 dark:from-blue-950/30 dark:to-blue-900/20">
        <div className="flex flex-row items-start justify-between pb-2 shrink-0 pt-4 px-4">
          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Jobs
            </p>
            <div className="text-2xl sm:text-3xl font-bold text-foreground leading-none">
              {totalJobs}
            </div>
          </div>
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/40 p-2 sm:p-2.5 shadow-sm">
            <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-end pb-4 px-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">
              This Week
            </span>
            <div className="flex items-center gap-1">
              {wowChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
              )}
              <span
                className={`text-[10px] sm:text-xs font-semibold ${wowChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {Math.abs(wowChange)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
            <span className="text-muted-foreground">
              New jobs: {jobsThisWeek}
            </span>
            <span className="text-muted-foreground/70">
              vs {jobsLastWeek} last week
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all"
              style={{
                width: `${Math.min((jobsThisWeek / Math.max(jobsLastWeek, 1)) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Active Jobs */}
      <div className="aspect-square flex flex-col relative overflow-hidden rounded-lg border-2 border-orange-200/50 dark:border-orange-800/50 transition-all active:scale-[0.98] active:opacity-90 bg-linear-to-br from-orange-50/60 to-orange-100/40 dark:from-orange-950/30 dark:to-orange-900/20">
        <div className="flex flex-row items-start justify-between pb-2 shrink-0 pt-4 px-4">
          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Active Jobs
            </p>
            <div className="text-2xl sm:text-3xl font-bold text-foreground leading-none">
              {activeJobs}
            </div>
          </div>
          <div className="rounded-lg bg-orange-100 dark:bg-orange-900/40 p-2 sm:p-2.5 shadow-sm">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-end pb-4 px-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">
              Active Rate
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-orange-600 dark:text-orange-400">
              {activePercentage}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
            <span className="text-muted-foreground">
              In Progress:{" "}
              {allJobs.filter((j) => j.status === "in_progress").length}
            </span>
            <span className="text-muted-foreground/70">
              Collected:{" "}
              {allJobs.filter((j) => j.status === "collected").length}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 dark:bg-orange-400 rounded-full transition-all"
              style={{ width: `${activePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Completed Today */}
      <div className="aspect-square flex flex-col relative overflow-hidden rounded-lg border-2 border-green-200/50 dark:border-green-800/50 transition-all active:scale-[0.98] active:opacity-90 bg-linear-to-br from-green-50/60 to-green-100/40 dark:from-green-950/30 dark:to-green-900/20">
        <div className="flex flex-row items-start justify-between pb-2 shrink-0 pt-4 px-4">
          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Completed Today
            </p>
            <div className="text-2xl sm:text-3xl font-bold text-foreground leading-none">
              {completedToday}
            </div>
          </div>
          <div className="rounded-lg bg-green-100 dark:bg-green-900/40 p-2 sm:p-2.5 shadow-sm">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-end pb-4 px-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">
              This Week
            </span>
            <div className="flex items-center gap-1">
              {completionWowChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-400" />
              )}
              <span
                className={`text-[10px] sm:text-xs font-semibold ${completionWowChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {Math.abs(completionWowChange)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
            <span className="text-muted-foreground">
              Week total: {completedThisWeek}
            </span>
            <span className="text-muted-foreground/70">
              vs {completedLastWeek} last week
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all"
              style={{
                width: `${Math.min((completedThisWeek / Math.max(completedLastWeek, 1)) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Delivered */}
      <div className="aspect-square flex flex-col relative overflow-hidden rounded-lg border-2 border-purple-200/50 dark:border-purple-800/50 transition-all active:scale-[0.98] active:opacity-90 bg-linear-to-br from-purple-50/60 to-purple-100/40 dark:from-purple-950/30 dark:to-purple-900/20">
        <div className="flex flex-row items-start justify-between pb-2 shrink-0 pt-4 px-4">
          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Delivered
            </p>
            <div className="text-2xl sm:text-3xl font-bold text-foreground leading-none">
              {deliveredJobs}
            </div>
          </div>
          <div className="rounded-lg bg-purple-100 dark:bg-purple-900/40 p-2 sm:p-2.5 shadow-sm">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-end pb-4 px-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">
              Completion Rate
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400">
              {completionRate}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
            <span className="text-muted-foreground">
              Completed: {completedJobs}
            </span>
            <span className="text-muted-foreground/70">Total: {totalJobs}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 dark:bg-purple-400 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
