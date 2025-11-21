'use client'

import { useRouter } from 'next/navigation'
import { JobDetail } from './JobDetail'
import type { Job } from '@/types/types'
import type { StatusHistory } from './StatusTimeline'
import { useRecentJobs } from '@/hooks/use-recent-jobs'

interface JobDetailClientProps {
  job: Job
  originalJob?: Job
  statusHistory?: StatusHistory[]
  showStatusCard?: boolean
}

export function JobDetailClient({ job, originalJob, statusHistory = [], showStatusCard = true }: JobDetailClientProps) {
  const router = useRouter()

  // Track recent job view
  useRecentJobs(job.id, job.job_number, job.customer_name)

  const handleStatusUpdate = () => {
    router.refresh()
  }

  return (
    <JobDetail
      job={job}
      originalJob={originalJob}
      statusHistory={statusHistory}
      onStatusUpdate={handleStatusUpdate}
      renderStatusCard={showStatusCard}
    />
  )
}

