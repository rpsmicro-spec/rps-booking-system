import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Mirrors the mobile customer card in CustomersTable 1:1. */
function CustomerCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden" aria-hidden>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="h-6 flex items-center">
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-5 w-5 rounded-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          {["w-52", "w-32"].map((w, i) => (
            <div key={i} className="flex items-center gap-2 h-4">
              <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-sm" />
              <Skeleton className={`h-3 ${w}`} />
            </div>
          ))}
        </div>
        <div className="space-y-3 pt-2 border-t border-border/60">
          <div className="flex items-center gap-4 h-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="w-full h-8" />
        </div>
      </div>
    </div>
  );
}

const COLUMNS = ["Customer Name", "Contact", "Address", "Jobs"];

/** Same Table markup and row height as the desktop CustomersTable. */
function CustomersTableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-md border" aria-hidden>
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-3.5 w-48" /></TableCell>
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-8 w-[108px]" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CustomersListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
          <CustomerCardSkeleton key={i} />
        ))}
      </div>
      <div className="hidden md:block">
        <CustomersTableSkeleton rows={rows} />
      </div>
    </>
  );
}
