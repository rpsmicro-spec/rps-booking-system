// Job Status Constants
// These should match the database enum/check constraint
export const JOB_STATUS = {
  COLLECTED: 'collected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELIVERED: 'delivered',
} as const

// Import and re-export JobStatus from generated types
import type { JobStatus } from '@/types/types'
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
  INVOICES: 5 * 1024 * 1024, // 5MB
  PDFS: 5 * 1024 * 1024, // 5MB
} as const

// Allowed File Types
export const ALLOWED_FILE_TYPES = {
  PHOTOS: ['image/jpeg', 'image/png', 'image/webp'],
  INVOICES: ['application/pdf'],
} as const

// Company Information
export const COMPANY_INFO = {
  NAME: 'RPS Micro Electronics',
  ADDRESS: 'No. 249, New Tiny Sector\nAmbattur Industrial Estate\nChennai - 600 058',
  ADDRESS_SINGLE_LINE: 'No. 249, New Tiny Sector, Ambattur Industrial Estate, Chennai - 600 058',
  PHONE: '+91 98849 01472',
  TEL: '044-42753826',
  EMAIL: 'rpsmicro@gmail.com',
  GOOGLE_MAPS_LINK: 'https://maps.app.goo.gl/QBra9hMt327mzUe77?g_st=ipc',
  WHATSAPP_NUMBER: '+919884901472',
} as const

