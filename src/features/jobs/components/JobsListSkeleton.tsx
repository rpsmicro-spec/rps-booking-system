import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * First-load placeholders that mirror JobCardMobile and the JobsTable rows
 * 1:1 (same containers, paddings, line heights), so the real list replaces
 * them without a layout jump. Mobile vs desktop is chosen by CSS, not by
 * useIsMobile(), which is false on the first render on every device.
 */

/** Same box model as JobCardMobile (header, 3 info lines, contact, actions). */
export function JobCardMobileSkeleton() {
  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden" aria-hidden>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* text-base line (24px) / text-sm line (20px) + mt-0.5 */}
            <div className="h-6 flex items-center">
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="mt-0.5 h-5 flex items-center">
              <Skeleton className="h-3.5 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-5 mt-0.5 rounded-sm" />
          </div>
        </div>

        {/* material, address (usually 2 lines), booked */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 h-4">
            <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-sm" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex items-start gap-2">
            <Skeleton className="h-3.5 w-3.5 shrink-0 mt-0.5 rounded-sm" />
            <div className="flex-1 space-y-1.5 py-0.5">
              <Skeleton className="h-3 w-full max-w-64" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-2 h-4">
            <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-sm" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        {/* phone + email: same wrapping row as the real card */}
        <div className="flex items-center gap-4 flex-wrap pt-3 border-t border-border/60">
          <div className="flex items-center gap-1.5 h-4">
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex items-center gap-1.5 h-4">
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
            <Skeleton className="h-3 w-52" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-border/60">
          <Skeleton className="flex-1 h-8" />
          <Skeleton className="flex-1 h-8" />
          <Skeleton className="h-8 w-[38px]" />
        </div>
      </div>
    </div>
  );
}

const JOB_COLUMNS = ["Job Number", "Customer", "Status", "Booking Date", "Contact"];

/** Same Table/TableRow/TableCell markup and row height as JobsTable. */
export function JobsTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="rounded-md border" aria-hidden>
      <Table>
        <TableHeader>
          <TableRow>
            {JOB_COLUMNS.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell><Skeleton className="h-[22px] w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell>
                {/* two text-sm lines, like phone + email */}
                <div className="space-y-1.5 py-0.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-36" />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto size-9" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function JobsListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
          <JobCardMobileSkeleton key={i} />
        ))}
      </div>
      <div className="hidden md:block">
        <JobsTableSkeleton rows={rows} />
      </div>
    </>
  );
}
