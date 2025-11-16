'use client'

import { useRouter } from 'next/navigation'
import { JobDetail } from './JobDetail'
import type { Job } from '@/types/types'
import type { StatusHistory } from './StatusTimeline'

interface JobDetailClientProps {
  job: Job
  originalJob?: Job
  statusHistory?: StatusHistory[]
  showStatusCard?: boolean
}

export function JobDetailClient({ job, originalJob, statusHistory = [], showStatusCard = true }: JobDetailClientProps) {
  const router = useRouter()

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

