'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, JOB_STATUS } from '@/lib/constants'
import type { Job, JobStatus } from '@/types/types'
import { Calendar, Phone, Mail } from 'lucide-react'
import { format } from 'date-fns'

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-500'
    switch (status) {
      case JOB_STATUS.COMPLETED:
        return 'bg-green-500'
      case JOB_STATUS.IN_PROGRESS:
        return 'bg-blue-500'
      case JOB_STATUS.DELIVERED:
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string | null): string => {
    if (!status) return 'Unknown'
    if (Object.values(JOB_STATUS).includes(status as JobStatus)) {
      return STATUS_LABELS[status as JobStatus]
    }
    return 'Unknown'
  }

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{job.job_number}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {job.customer_name}
              </p>
            </div>
            <Badge
              className={`${getStatusColor(job.status)} text-white`}
            >
              {getStatusLabel(job.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {job.booking_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(job.booking_date), 'MMM dd, yyyy')}
              </span>
            </div>
          )}
          {job.contact_number && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{job.contact_number}</span>
            </div>
          )}
          {job.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{job.email}</span>
            </div>
          )}
          {job.material_type && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Material:</span> {job.material_type}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

