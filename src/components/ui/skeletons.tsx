import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Skeleton for stats cards (dashboard)
 */
export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Skeleton for job/customer cards grid
 */
export function CardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full mt-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Skeleton for table rows
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 5,
  showHeader = true 
}: { 
  rows?: number
  columns?: number
  showHeader?: boolean
}) {
  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          {showHeader && (
            <thead>
              <tr className="border-b">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="h-12 px-4 text-left align-middle">
                    <Skeleton className="h-4 w-24" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="p-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Skeleton for search and filters
 */
export function SearchAndFiltersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for detail page
 */
export function DetailPageSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <Card className="md:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

