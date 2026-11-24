'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Eye, Edit, Trash2, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { ClientOnly } from '@/components/client-only'
import { CachedDataNote } from '@/components/offline/CachedDataNote'
import { useOnlineStatus } from '@/hooks/use-online-status'
import {
  removeJobFromCaches,
  seedJobDetailsFromList,
  type JobsListResponse,
} from '@/lib/swr/job-cache'
import { JobsListSkeleton } from './JobsListSkeleton'
import { Briefcase } from 'lucide-react'
import type { Job, JobStatus } from '@/types/types'
import { format } from 'date-fns'
import { utcToIstDateObject } from "@/lib/utils/date-ist";
import { toast } from 'sonner'
import { STATUS_LABELS, getStatusBadgeCustomClasses } from '@/lib/constants'
import { useIsMobile } from '@/hooks/use-mobile'
import { JobCardMobile } from './JobCardMobile'
import { formatPhoneDisplay } from "@/lib/utils/format-phone";

interface JobsTableProps {
  status?: string | null
  search?: string
  dateFrom?: string | null
  dateTo?: string | null
  limit?: number
  offset?: number
  onTotalChange?: (total: number) => void
}

/** Stable SWR key per filter/search/page (same param order every time). */
export function jobsListKey(p: {
  status?: string | null
  search?: string
  dateFrom?: string | null
  dateTo?: string | null
  limit: number
  offset: number
}) {
  const params = new URLSearchParams()
  if (p.status) params.append('status', p.status)
  if (p.search) params.append('search', p.search)
  if (p.dateFrom) params.append('dateFrom', p.dateFrom)
  if (p.dateTo) params.append('dateTo', p.dateTo)
  params.append('limit', p.limit.toString())
  params.append('offset', p.offset.toString())
  return `/api/jobs?${params.toString()}`
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    // Clearing the search applies at once; typing is debounced.
    const id = setTimeout(() => setDebounced(value), value ? delayMs : 0)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

/**
 * Client-only so the persisted cache can render on the very first client
 * paint without a hydration mismatch; server + hydration show the skeleton.
 */
export function JobsTable(props: JobsTableProps) {
  return (
    <ClientOnly fallback={<JobsListSkeleton rows={props.limit ?? 10} />}>
      <JobsTableInner {...props} />
    </ClientOnly>
  )
}

function JobsTableInner({
  status,
  search,
  dateFrom,
  dateTo,
  limit = 50,
  offset = 0,
  onTotalChange,
}: JobsTableProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const isOnline = useOnlineStatus()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const debouncedSearch = useDebouncedValue(search ?? '', 300)
  const swrKey = jobsListKey({ status, search: debouncedSearch, dateFrom, dateTo, limit, offset })
  // Stale-while-revalidate: cached page renders instantly, then refreshes.
  // keepPreviousData (provider) keeps the old page visible while a new
  // filter/page loads; SWR ignores responses for superseded keys.
  const { data, error, isLoading, mutate } = useSWR<JobsListResponse>(swrKey)
  const jobs = data?.jobs ?? []
  const showingPrevious = isLoading && !!data

  useEffect(() => {
    if (data && !showingPrevious) onTotalChange?.(data.total || 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, showingPrevious])

  // Cheap detail-cache seeding from the rows we already have.
  useEffect(() => {
    if (data?.jobs && !showingPrevious) seedJobDetailsFromList(data.jobs)
  }, [data, showingPrevious])

  const prefetchJob = (jobId: string) => router.prefetch(`/jobs/${jobId}`)

  const handleRowClick = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
  }

  const handleDeleteClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation()
    setJobToDelete(job)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/jobs/${jobToDelete.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to delete job')
        return
      }

      toast.success('Job deleted successfully')
      setDeleteDialogOpen(false)
      setJobToDelete(null)
      await removeJobFromCaches(jobToDelete.id)
      void mutate()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  // First load with nothing cached: layout-matched skeleton.
  if (!data) {
    if (error) {
      return (
        <div className="p-8 sm:p-12 text-center">
          <p className="text-sm text-destructive">
            {!isOnline
              ? "You're offline and this list hasn't been loaded on this phone yet."
              : 'Failed to load jobs. Please check your connection.'}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void mutate()}>
            Try Again
          </Button>
        </div>
      )
    }
    return <JobsListSkeleton rows={limit} />
  }

  const statusLine = (
    <div className="flex min-h-4 items-center gap-2 empty:hidden">
      <CachedDataNote swrKey={swrKey} error={error} hasData={!!data} />
      {showingPrevious && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Loading…
        </span>
      )}
    </div>
  )

  const emptyState = (
    <div className="p-8 sm:p-12">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Briefcase className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>
            {search || status || dateFrom || dateTo
              ? 'No Jobs Found'
              : 'No Jobs Yet'}
          </EmptyTitle>
          <EmptyDescription>
            {search || status || dateFrom || dateTo
              ? 'No jobs match your filters. Try adjusting your search criteria.'
              : 'Get started by creating your first job.'}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )

  // Mobile Card View
  if (isMobile) {
    return (
      <>
        {statusLine}
        <div className={`space-y-3 transition-opacity ${showingPrevious ? 'opacity-60' : ''}`}>
          {jobs.length === 0 ? (
            emptyState
          ) : (
            jobs.map((job) => (
              <div key={job.id} onTouchStart={() => prefetchJob(job.id)}>
                <JobCardMobile
                  job={job}
                  onCardClick={handleRowClick}
                  showActions={true}
                  onEdit={(jobId) => router.push(`/jobs/${jobId}/edit`)}
                  onDelete={(job) => {
                    const e = { stopPropagation: () => {} } as React.MouseEvent
                    handleDeleteClick(e, job)
                  }}
                  offline={!isOnline}
                />
              </div>
            ))
          )}
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Job</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete job <strong>{jobToDelete?.job_number}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting || !isOnline}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // Desktop Table View
  return (
    <div className="space-y-2">
    {statusLine}
    <div className={`rounded-md border transition-opacity ${showingPrevious ? 'opacity-60' : ''}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Booking Date</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="p-0">
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            jobs.map((job) => (
              <TableRow
                key={job.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(job.id)}
                onPointerEnter={() => prefetchJob(job.id)}
              >
                <TableCell className="font-medium tabular-nums">{job.job_number}</TableCell>
                <TableCell>{job.customer_name}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeCustomClasses(job.status as JobStatus)}>
                    {job.status ? (STATUS_LABELS[job.status as JobStatus] || 'Unknown') : 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">
                  {job.booking_date
                    ? (() => {
                        const istDate = utcToIstDateObject(job.booking_date);
                        return istDate ? format(istDate, 'MMM dd, yyyy') : '-';
                      })()
                    : '-'}
                </TableCell>
                <TableCell>
                  {job.contact_number || job.email ? (
                    <div className="text-sm">
                      {job.contact_number && (
                        <div className="tabular-nums">
                          {formatPhoneDisplay(job.contact_number)}
                        </div>
                      )}
                      {job.email && (
                        <div className="text-muted-foreground truncate max-w-[200px]">
                          {job.email}
                        </div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/jobs/${job.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {isOnline ? (
                        <DropdownMenuItem asChild>
                          <Link href={`/jobs/${job.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit (offline)
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteClick(e, job)}
                        className="text-destructive"
                        disabled={!isOnline}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isOnline ? 'Delete' : "Delete (offline)"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete job <strong>{jobToDelete?.job_number}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting || !isOnline}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </div>
  )
}

