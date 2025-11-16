'use client'

import { useEffect, useState } from 'react'
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
import { MoreHorizontal, Eye, Edit, Trash2, Calendar, Phone, Mail, Package } from 'lucide-react'
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
import { TableSkeleton } from '@/components/ui/skeletons'
import { Briefcase } from 'lucide-react'
import type { Job, JobStatus } from '@/types/types'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { STATUS_LABELS } from '@/lib/constants'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  collected: 'default',
  in_progress: 'secondary',
  completed: 'outline',
  delivered: 'default',
}

interface JobsTableProps {
  status?: string | null
  search?: string
  dateFrom?: string | null
  dateTo?: string | null
  limit?: number
  offset?: number
  onTotalChange?: (total: number) => void
}

export function JobsTable({
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
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, dateFrom, dateTo, limit, offset])

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (search) params.append('search', search)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())

      const response = await fetch(`/api/jobs?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('Failed to fetch jobs:', result.error)
        return
      }

      setJobs(result.jobs || [])
      onTotalChange?.(result.total || 0)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
      await fetchJobs()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return isMobile ? (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-2/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
      <TableSkeleton rows={5} columns={5} />
    )
  }

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
        <div className="space-y-3">
          {jobs.length === 0 ? (
            emptyState
          ) : (
            jobs.map((job) => (
              <Card
                key={job.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleRowClick(job.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{job.job_number}</h3>
                      <div className="mt-0.5 space-y-0.5">
                        <p className="text-sm text-muted-foreground truncate">
                          {job.customer_name}
                        </p>
                        {(job as Job & { contact_person_name?: string; contact_person_designation?: string }).contact_person_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {(job as Job & { contact_person_name?: string; contact_person_designation?: string }).contact_person_name}
                            {(job as Job & { contact_person_name?: string; contact_person_designation?: string }).contact_person_designation && (
                              <span className="ml-1">({(job as Job & { contact_person_name?: string; contact_person_designation?: string }).contact_person_designation})</span>
                            )}
                          </p>
                        )}
                        {((job as Job & { address_city?: string }).address_city || (job as Job & { address_state?: string }).address_state) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {(job as Job & { address_city?: string }).address_city}
                            {(job as Job & { address_city?: string }).address_city && (job as Job & { address_state?: string }).address_state && ', '}
                            {(job as Job & { address_state?: string }).address_state}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={job.status ? (STATUS_COLORS[job.status] || 'default') : 'default'}
                      className="flex-shrink-0"
                    >
                      {job.status ? (STATUS_LABELS[job.status as JobStatus] || 'Unknown') : 'Unknown'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {job.email && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{job.email}</span>
                    </div>
                  )}
                  {job.contact_number && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{job.contact_number}</span>
                    </div>
                  )}
                  {job.material_type && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Package className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{job.material_type}</span>
                    </div>
                  )}
                  {job.booking_date && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Booking: {format(new Date(job.booking_date), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/jobs/${job.id}`}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/jobs/${job.id}/edit`}>
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(e, job)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                disabled={isDeleting}
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
    <div className="rounded-md border">
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
              >
                <TableCell className="font-medium">{job.job_number}</TableCell>
                <TableCell>{job.customer_name}</TableCell>
                <TableCell>
                  <Badge variant={job.status ? (STATUS_COLORS[job.status] || 'default') : 'default'}>
                    {job.status ? (STATUS_LABELS[job.status as JobStatus] || 'Unknown') : 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {job.booking_date
                    ? format(new Date(job.booking_date), 'MMM dd, yyyy')
                    : '-'}
                </TableCell>
                <TableCell>
                  {job.contact_number || job.email ? (
                    <div className="text-sm">
                      {job.contact_number && <div>{job.contact_number}</div>}
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
                      <DropdownMenuItem asChild>
                        <Link href={`/jobs/${job.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteClick(e, job)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
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
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

