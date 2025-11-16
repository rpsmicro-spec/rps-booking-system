'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { JOB_STATUS, STATUS_LABELS, STATUS_WORKFLOW } from '@/lib/constants'
import type { JobStatus } from '@/types/types'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface StatusUpdateProps {
  currentStatus: JobStatus
  jobId: string
  onStatusUpdate?: () => void
}

export function StatusUpdate({
  currentStatus,
  jobId,
  onStatusUpdate,
}: StatusUpdateProps) {
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const nextStatuses = STATUS_WORKFLOW[currentStatus] || []
  const canUpdate = nextStatuses.length > 0

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (newStatus === currentStatus) {
      setSelectedStatus(null)
      return
    }

    setIsUpdating(true)
    setSelectedStatus(newStatus)

    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status')
      }

      toast.success(
        `Status updated to ${STATUS_LABELS[newStatus]}`
      )
      setSelectedStatus(null)
      onStatusUpdate?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status'
      )
      setSelectedStatus(null)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!canUpdate) {
    return (
      <div className="text-sm text-muted-foreground">
        Status: <strong>{STATUS_LABELS[currentStatus]}</strong> (Final status)
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <Select
          value={selectedStatus || currentStatus}
          onValueChange={(value) => handleStatusChange(value as JobStatus)}
          disabled={isUpdating}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={currentStatus}>
              {STATUS_LABELS[currentStatus]} (Current)
            </SelectItem>
            {nextStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isUpdating && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}

