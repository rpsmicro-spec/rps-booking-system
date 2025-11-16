'use client'

import { format } from 'date-fns'
import type { JobStatus } from '@/types/types'
import { CheckCircle2, Circle } from 'lucide-react'
import { STATUS_LABELS, JOB_STATUS } from '@/lib/constants'

export interface StatusHistory {
  id: string
  old_status: string | null
  new_status: string
  changed_at: string | null
  changed_by: string | null
}

interface StatusTimelineProps {
  currentStatus: JobStatus
  statusHistory?: StatusHistory[]
}

const STATUS_ORDER: JobStatus[] = [
  JOB_STATUS.COLLECTED,
  JOB_STATUS.IN_PROGRESS,
  JOB_STATUS.COMPLETED,
  JOB_STATUS.DELIVERED,
]

export function StatusTimeline({
  currentStatus,
  statusHistory = [],
}: StatusTimelineProps) {
  const currentStatusIndex = STATUS_ORDER.indexOf(currentStatus)

  return (
    <div className="space-y-0">
      {STATUS_ORDER.map((status, index) => {
        const isCompleted = index <= currentStatusIndex
        const isCurrent = index === currentStatusIndex
        const historyEntry = statusHistory.find(
          (h) => h.new_status === status
        )
        const isLast = index === STATUS_ORDER.length - 1
        const nextIsCompleted = index < STATUS_ORDER.length - 1 && index + 1 <= currentStatusIndex

        return (
          <div key={status}>
            <div className="flex items-start gap-4">
              {/* Status Icon with connecting line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="mt-1">
                  {isCompleted ? (
                    <CheckCircle2
                      className={`h-5 w-5 ${
                        isCurrent
                          ? 'text-green-600 dark:text-green-500'
                          : 'text-green-500 dark:text-green-400'
                      }`}
                    />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                {/* Vertical line */}
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[2rem] mt-2 ${
                      nextIsCompleted
                        ? 'bg-green-500 dark:bg-green-400'
                        : 'bg-border'
                    }`}
                  />
                )}
              </div>

              {/* Status Info */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent
                        ? 'text-green-600 dark:text-green-500'
                        : isCompleted
                        ? 'text-green-600 dark:text-green-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </p>
                  {isCurrent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      Current
                    </span>
                  )}
                </div>
                {historyEntry && historyEntry.changed_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(historyEntry.changed_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
                {!historyEntry && isCompleted && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Status set on creation
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

