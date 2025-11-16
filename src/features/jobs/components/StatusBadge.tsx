'use client'

import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, JOB_STATUS } from '@/lib/constants'
import type { JobStatus } from '@/types/types'

interface StatusBadgeProps {
  status: JobStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JOB_STATUS.COMPLETED:
        return 'bg-green-500 hover:bg-green-600'
      case JOB_STATUS.IN_PROGRESS:
        return 'bg-blue-500 hover:bg-blue-600'
      case JOB_STATUS.DELIVERED:
        return 'bg-purple-500 hover:bg-purple-600'
      case JOB_STATUS.COLLECTED:
        return 'bg-gray-500 hover:bg-gray-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  return (
    <Badge className={`${getStatusColor(status)} text-white ${className || ''}`}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

