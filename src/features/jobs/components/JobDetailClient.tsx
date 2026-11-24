'use client'

import { useEffect, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { JobDetail } from './JobDetail'
import type { Job, JobStatus } from '@/types/types'
import type { StatusHistory } from './StatusTimeline'
import { useRecentJobs } from '@/hooks/use-recent-jobs'
import {
  clearStatusOverride,
  useEffectiveJobStatus,
} from '@/lib/jobs/status-overrides'
import { JOB_CHANGED_EVENT } from '@/lib/jobs/status-sync-effects'
import { restoreQueuedOverride } from '@/lib/jobs/status-client'
import { storeJobDetail } from '@/lib/swr/job-cache'

interface JobDetailClientProps {
  job: Job
  originalJob?: Job
  statusHistory?: StatusHistory[]
  showStatusCard?: boolean
}

export function JobDetailClient({ job, originalJob, statusHistory = [], showStatusCard = true }: JobDetailClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const serverStatus = job.status as JobStatus
  const { status, override } = useEffectiveJobStatus(job.id, serverStatus)

  // Track recent job view
  useRecentJobs(job.id, job.job_number, job.customer_name)

  // Two instances render per page (status card + details); only the status
  // card instance owns the side effects.
  const ownsEffects = showStatusCard

  // Show queued offline changes after a reload.
  useEffect(() => {
    if (ownsEffects) void restoreQueuedOverride(job.id)
  }, [ownsEffects, job.id])

  // Cache this job's JSON (raw row, not the signed invoice URL) for lists
  // and future offline views.
  // (Only the details instance receives originalJob.)
  useEffect(() => {
    if (!originalJob) return
    storeJobDetail({ job: originalJob, statusHistory })
  }, [originalJob, statusHistory])

  // Once the server render shows the confirmed status, drop the override.
  useEffect(() => {
    if (ownsEffects && override?.state === 'confirmed' && serverStatus === override.status) {
      clearStatusOverride(job.id)
    }
  }, [ownsEffects, override, serverStatus, job.id])

  // Background server refresh after a status change settles (applied,
  // conflict or rejection) — never blocks the UI.
  useEffect(() => {
    if (!ownsEffects) return
    const onChanged = (e: Event) => {
      if ((e as CustomEvent<{ jobId: string }>).detail?.jobId !== job.id) return
      startTransition(() => router.refresh())
    }
    window.addEventListener(JOB_CHANGED_EVENT, onChanged)
    return () => window.removeEventListener(JOB_CHANGED_EVENT, onChanged)
  }, [ownsEffects, job.id, router])

  const handleUpdate = () => {
    startTransition(() => router.refresh())
  }

  const effectiveJob = useMemo(
    () => (status === serverStatus ? job : { ...job, status }),
    [job, status, serverStatus]
  )

  // Optimistic timeline entry until the server history includes it.
  const effectiveHistory = useMemo(() => {
    if (!override || status === serverStatus) return statusHistory
    if (statusHistory.some((h) => h.new_status === status)) return statusHistory
    return [
      ...statusHistory,
      {
        id: `optimistic-${job.id}-${status}`,
        old_status: override.baseStatus,
        new_status: status,
        changed_at: override.changedAt,
        changed_by: null,
      },
    ]
  }, [override, status, serverStatus, statusHistory, job.id])

  return (
    <JobDetail
      job={effectiveJob}
      originalJob={originalJob}
      statusHistory={effectiveHistory}
      onStatusUpdate={handleUpdate}
      renderStatusCard={showStatusCard}
    />
  )
}
