import { Suspense } from "react";
import { LayoutGrid } from "lucide-react";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { DashboardPageClient } from "@/features/dashboard/components/DashboardPageClient";
import { DashboardStatsContent } from "@/features/dashboard/components/DashboardStatsContent";
import { DashboardRecentJobsContent } from "@/features/dashboard/components/DashboardRecentJobsContent";
import {
  StatsCardsSkeleton,
  RecentJobsSkeleton,
} from "@/components/ui/skeletons";

export default function DashboardPage() {
  return (
    <DashboardPageClient>
      <div className="flex-1 space-y-4">
        <div className="flex flex-col gap-2 pt-2 md:pt-4">
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Dashboard
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Overview of your job management system and key metrics.
          </p>
        </div>

        <QuickActions />

        <Suspense fallback={<StatsCardsSkeleton />}>
          <DashboardStatsContent />
        </Suspense>

        <div className="grid gap-4">
          <Suspense fallback={<RecentJobsSkeleton />}>
            <DashboardRecentJobsContent />
          </Suspense>
        </div>
      </div>
    </DashboardPageClient>
  );
}
