'use client'

import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, getStatusBadgeColor } from '@/lib/constants'
import type { JobStatus } from '@/types/types'

interface StatusBadgeProps {
  status: JobStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge className={`${getStatusBadgeColor(status)} text-white ${className || ''}`}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

