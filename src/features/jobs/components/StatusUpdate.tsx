'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_LABELS, STATUS_WORKFLOW } from '@/lib/constants'
import type { JobStatus } from '@/types/types'
import { CloudUpload, Loader2 } from 'lucide-react'
import { changeJobStatus } from '@/lib/jobs/status-client'
import { useEffectiveJobStatus } from '@/lib/jobs/status-overrides'

interface StatusUpdateProps {
  currentStatus: JobStatus // server status
  jobId: string
  jobNumber: string
}

/**
 * Optimistic: the select, badge, timeline and cached lists change at once;
 * the PATCH (or the offline queue) runs in the background and the change is
 * rolled back with a toast if the server refuses it.
 */
export function StatusUpdate({ currentStatus, jobId, jobNumber }: StatusUpdateProps) {
  const { status, isPending, isQueued, override } = useEffectiveJobStatus(jobId, currentStatus)

  const nextStatuses = STATUS_WORKFLOW[status] || []
  const canUpdate = nextStatuses.length > 0
  const isSending = override?.state === 'sending'

  const handleStatusChange = (value: string) => {
    const newStatus = value as JobStatus
    if (newStatus === status || isSending) return
    void changeJobStatus({ jobId, jobNumber, fromStatus: status, toStatus: newStatus })
  }

  const pendingNote = isQueued ? (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
      <CloudUpload className="h-3.5 w-3.5" aria-hidden />
      Saved on this phone — will sync when you&apos;re back online
    </p>
  ) : null

  if (!canUpdate) {
    return (
      <div>
        <div className="text-sm text-muted-foreground">
          Status: <strong>{STATUS_LABELS[status]}</strong> (Final status)
        </div>
        {pendingNote}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <Select
            value={status}
            onValueChange={handleStatusChange}
            // Block a second change only while the first is in flight; a
            // queued (offline) change can be followed by the next step.
            disabled={isSending}
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={status}>
                {STATUS_LABELS[status]} (Current)
              </SelectItem>
              {nextStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isSending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" aria-label="Saving" />
        )}
      </div>
      {isPending && pendingNote}
    </div>
  )
}
