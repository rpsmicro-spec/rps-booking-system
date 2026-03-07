'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, getStatusBadgeColor } from '@/lib/constants'
import type { Job, JobStatus } from '@/types/types'
import { Calendar, Phone, Mail, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { utcToIstDateObject } from "@/lib/utils/date-ist";

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const getStatusLabel = (status: string | null): string => {
    if (!status) return 'Unknown'
    return STATUS_LABELS[status as JobStatus] || 'Unknown'
  }

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 overflow-hidden">
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="font-semibold text-lg truncate">{job.job_number}</h3>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {job.customer_name}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                className={`${getStatusBadgeColor(job.status as JobStatus)} text-white`}
              >
                {getStatusLabel(job.status)}
              </Badge>
              <ChevronRight className="h-5 w-5 text-muted-foreground/60" aria-hidden />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {job.booking_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {(() => {
                  const istDate = utcToIstDateObject(job.booking_date);
                  return istDate ? format(istDate, 'MMM dd, yyyy') : '';
                })()}
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

