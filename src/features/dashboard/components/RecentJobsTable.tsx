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
import { MoreHorizontal, Eye, Calendar } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { STATUS_LABELS } from '@/lib/constants'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  collected: 'default',
  in_progress: 'secondary',
  completed: 'outline',
  delivered: 'default',
}

export function RecentJobsTable() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecentJobs()
  }, [])

  const fetchRecentJobs = async () => {
    try {
      // Fetch recent jobs (more than we need, we'll filter client-side)
      const response = await fetch(`/api/jobs?limit=50`)
      const result = await response.json()

      if (!response.ok) {
        console.error('Failed to fetch recent jobs:', result.error)
        return
      }

      // Filter jobs created this week (from start of current week)
      const now = new Date()
      const startOfWeek = new Date(now)
      // Get Monday of current week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust to Monday
      startOfWeek.setDate(diff)
      startOfWeek.setHours(0, 0, 0, 0)

      const recentJobs = (result.jobs || [])
        .filter((job: Job) => {
          if (!job.created_at) return false
          const createdDate = new Date(job.created_at)
          return createdDate >= startOfWeek
        })
        .slice(0, 12) // Limit to 12 items

      setJobs(recentJobs)
    } catch (error) {
      console.error('Error fetching recent jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRowClick = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
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
          <EmptyTitle>No Recent Jobs</EmptyTitle>
          <EmptyDescription>
            No jobs found this week. Create a new job to get started.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )

  // Mobile Card View
  if (isMobile) {
    return (
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
                      {(job as Job & { contact_person_name?: string }).contact_person_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {(job as Job & { contact_person_name?: string }).contact_person_name}
                        </p>
                      )}
                      {(job as Job & { address_city?: string }).address_city && (
                        <p className="text-xs text-muted-foreground truncate">
                          {(job as Job & { address_city?: string }).address_city}
                          {(job as Job & { address_state?: string }).address_state && 
                            `, ${(job as Job & { address_state?: string }).address_state}`
                          }
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
                {job.booking_date && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {format(new Date(job.booking_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/jobs/${job.id}`}>
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="p-0">
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

