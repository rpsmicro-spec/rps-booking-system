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
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
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
    return <TableSkeleton rows={5} columns={5} />
  }

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
                <div className="p-12">
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

