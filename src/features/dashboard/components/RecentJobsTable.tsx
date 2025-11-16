'use client'

import { useEffect, useState } from 'react'
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
import { MoreHorizontal, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyContent,
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

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  collected: 'default',
  in_progress: 'secondary',
  completed: 'outline',
  delivered: 'default',
}

export function RecentJobsTable() {
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

      // Filter jobs created in the last week
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      oneWeekAgo.setHours(0, 0, 0, 0)

      const recentJobs = (result.jobs || [])
        .filter((job: Job) => {
          if (!job.created_at) return false
          const createdDate = new Date(job.created_at)
          return createdDate >= oneWeekAgo
        })
        .slice(0, 12) // Limit to 12 items

      setJobs(recentJobs)
    } catch (error) {
      console.error('Error fetching recent jobs:', error)
    } finally {
      setIsLoading(false)
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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="p-0">
                <div className="p-12">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Briefcase className="h-6 w-6" />
                      </EmptyMedia>
                      <EmptyTitle>No Recent Jobs</EmptyTitle>
                      <EmptyDescription>
                        No jobs found in the last week. Create a new job to get started.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            jobs.map((job) => (
              <TableRow key={job.id}>
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
                <TableCell className="text-right">
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

