import { Skeleton } from "@/components/ui/skeleton";
import {
  CardsGridSkeleton,
  DetailPageSkeleton,
  SearchAndFiltersSkeleton,
  StatsCardsSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

// Shown instantly by Next.js while a dashboard route's server work runs, so a
// tap always gets visual feedback. Shapes roughly match each page's layout.

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2 pt-1 md:pt-2">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-8 w-44" />
      </div>
      <Skeleton className="h-4 w-64 max-w-full" />
    </div>
  );
}

type Variant = "dashboard" | "list" | "detail" | "form";

export function RouteLoading({ variant }: { variant: Variant }) {
  return (
    <div className="space-y-4 md:space-y-6" aria-busy="true" aria-label="Loading">
      <HeaderSkeleton />
      {variant === "dashboard" && (
        <>
          <StatsCardsSkeleton />
          <TableSkeleton rows={4} />
        </>
      )}
      {variant === "list" && (
        <>
          <SearchAndFiltersSkeleton />
          <div className="md:hidden">
            <CardsGridSkeleton count={3} />
          </div>
          <div className="hidden md:block">
            <TableSkeleton rows={8} />
          </div>
        </>
      )}
      {variant === "detail" && <DetailPageSkeleton />}
      {variant === "form" && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4 md:p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
