// Job Status Constants
// These should match the database enum/check constraint
export const JOB_STATUS = {
  COLLECTED: 'collected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELIVERED: 'delivered',
} as const

// Import and re-export JobStatus from generated types
import type { JobStatus } from '@/lib/types'
export type { JobStatus }

// Status Display Names
export const STATUS_LABELS: Record<JobStatus, string> = {
  [JOB_STATUS.COLLECTED]: 'Collected',
  [JOB_STATUS.IN_PROGRESS]: 'In Progress',
  [JOB_STATUS.COMPLETED]: 'Completed',
  [JOB_STATUS.DELIVERED]: 'Delivered',
}

// Status Workflow
export const STATUS_WORKFLOW: Record<JobStatus, JobStatus[]> = {
  [JOB_STATUS.COLLECTED]: [JOB_STATUS.IN_PROGRESS],
  [JOB_STATUS.IN_PROGRESS]: [JOB_STATUS.COMPLETED],
  [JOB_STATUS.COMPLETED]: [JOB_STATUS.DELIVERED],
  [JOB_STATUS.DELIVERED]: [],
}

// File Upload Limits
export const FILE_LIMITS = {
  PHOTOS: 5 * 1024 * 1024, // 5MB
  INVOICES: 10 * 1024 * 1024, // 10MB
  PDFS: 5 * 1024 * 1024, // 5MB
} as const

// Allowed File Types
export const ALLOWED_FILE_TYPES = {
  PHOTOS: ['image/jpeg', 'image/png', 'image/webp'],
  INVOICES: ['application/pdf'],
} as const

