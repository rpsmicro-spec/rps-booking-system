import { Suspense } from "react";
import { LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
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
      <div className="flex-1 space-y-4 md:space-y-6">
        <PageHeader
          icon={LayoutGrid}
          title="Dashboard"
          description="Overview of your job management system and key metrics."
        />

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
