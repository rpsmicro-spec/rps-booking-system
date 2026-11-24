'use client'

import { format } from 'date-fns'
import type { JobStatus } from '@/types/types'
import { CheckCircle2, Circle } from 'lucide-react'
import { STATUS_LABELS, JOB_STATUS } from '@/lib/constants'
import { utcToIstDateObject } from '@/lib/utils/date-ist'

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
    <div className="flex flex-col w-full">
      {/* Row: icons centered with horizontal connectors between */}
      <div className="flex flex-row items-center w-full">
        {STATUS_ORDER.map((status, index) => {
          const isCompleted = index <= currentStatusIndex
          const isCurrent = index === currentStatusIndex
          const nextIsCompleted =
            index < STATUS_ORDER.length - 1 && index + 1 <= currentStatusIndex
          return (
            <div
              key={status}
              className="flex-1 flex items-center min-w-0"
            >
              {/* Left connector: green only when we've reached this step (line leads to this step) */}
              <div
                className={`flex-1 min-h-0.5 ${
                  index > 0
                    ? isCompleted
                      ? 'bg-green-500 dark:bg-green-400'
                      : 'bg-border'
                    : 'bg-transparent'
                }`}
              />
              <div className="shrink-0 px-0.5 sm:px-1">
                {isCompleted ? (
                  <CheckCircle2
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      isCurrent
                        ? 'text-green-600 dark:text-green-500'
                        : 'text-green-500 dark:text-green-400'
                    }`}
                  />
                ) : (
                  <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                )}
              </div>
              {/* Right connector */}
              <div
                className={`flex-1 min-h-0.5 ${
                  index < STATUS_ORDER.length - 1
                    ? nextIsCompleted
                      ? 'bg-green-500 dark:bg-green-400'
                      : 'bg-border'
                    : 'bg-transparent'
                }`}
              />
            </div>
          )
        })}
      </div>
      {/* Row: labels + dates aligned under each icon */}
      <div className="flex flex-row w-full mt-2 gap-0">
        {STATUS_ORDER.map((status, index) => {
          const isCurrent = index === currentStatusIndex
          const historyEntry = statusHistory.find((h) => h.new_status === status)
          const isCompleted = index <= currentStatusIndex
          return (
            <div
              key={status}
              className="flex-1 flex flex-col items-center min-w-0 px-0.5 sm:px-1 text-center"
            >
              <div className="flex items-center gap-1 flex-wrap justify-center">
                <p
                  className={`text-xs font-medium leading-tight ${
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
                  <span className="text-xs px-1 sm:px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 shrink-0">
                    Current
                  </span>
                )}
              </div>
              {historyEntry?.changed_at && (
                <p className="text-xs leading-tight tabular-nums text-muted-foreground mt-0.5 max-w-full break-words">
                  {(() => {
                    const istDate = utcToIstDateObject(historyEntry.changed_at)
                    return istDate
                      ? format(istDate, 'MMM dd, yyyy HH:mm')
                      : ''
                  })()}
                </p>
              )}
              {!historyEntry && isCompleted && (
                <p className="text-xs leading-tight text-muted-foreground mt-0.5 max-w-full break-words">
                  Status set on creation
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

