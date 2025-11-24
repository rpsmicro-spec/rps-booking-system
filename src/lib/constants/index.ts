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

// Status Badge Colors (for shadcn Badge variants)
// Using UX-friendly color scheme following common standards:
// Since shadcn Badge has limited variants, we'll use custom background colors
// for better distinction. Variants are used as fallback but custom colors override.
export const STATUS_BADGE_VARIANTS: Record<JobStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [JOB_STATUS.COLLECTED]: 'secondary', // Amber/Yellow - pending state
  [JOB_STATUS.IN_PROGRESS]: 'default', // Blue - active state  
  [JOB_STATUS.COMPLETED]: 'outline', // Green - success state
  [JOB_STATUS.DELIVERED]: 'default', // Purple - final state (will use custom color)
}

// Custom badge classes that override variant colors for better distinction
export const STATUS_BADGE_CUSTOM_CLASSES: Record<JobStatus, string> = {
  [JOB_STATUS.COLLECTED]: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border-amber-500/50 dark:border-amber-500/60 text-amber-700 dark:text-amber-400', // Amber for pending
  [JOB_STATUS.IN_PROGRESS]: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 border-blue-500/50 dark:border-blue-500/60 text-blue-700 dark:text-blue-400', // Blue for active
  [JOB_STATUS.COMPLETED]: 'bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 border-green-500/50 dark:border-green-500/60 text-green-700 dark:text-green-400', // Green for success
  [JOB_STATUS.DELIVERED]: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-950/50 border-purple-500/50 dark:border-purple-500/60 text-purple-700 dark:text-purple-400', // Purple for delivered
}

// Status Badge Background Colors (for custom styled badges)
// These provide more control and distinct colors following UX best practices
export const STATUS_BADGE_COLORS: Record<JobStatus, string> = {
  [JOB_STATUS.COLLECTED]: 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700', // Amber/Yellow for pending
  [JOB_STATUS.IN_PROGRESS]: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700', // Blue for active
  [JOB_STATUS.COMPLETED]: 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700', // Green for success
  [JOB_STATUS.DELIVERED]: 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700', // Purple for delivered
}

// Helper function to get badge variant for shadcn Badge component
export function getStatusBadgeVariant(status: JobStatus | null | undefined): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!status) return 'default'
  return STATUS_BADGE_VARIANTS[status] || 'default'
}

// Helper function to get badge color class for custom styled badges
export function getStatusBadgeColor(status: JobStatus | null | undefined): string {
  if (!status) return 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700'
  return STATUS_BADGE_COLORS[status] || 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700'
}

// Helper function to get custom badge classes (includes colors + border + text)
export function getStatusBadgeCustomClasses(status: JobStatus | null | undefined): string {
  if (!status) return 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-950/30 dark:hover:bg-gray-950/50 border-gray-500/50 dark:border-gray-500/60 text-gray-700 dark:text-gray-400'
  return STATUS_BADGE_CUSTOM_CLASSES[status] || 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-950/30 dark:hover:bg-gray-950/50 border-gray-500/50 dark:border-gray-500/60 text-gray-700 dark:text-gray-400'
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

