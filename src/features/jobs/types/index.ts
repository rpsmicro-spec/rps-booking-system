/**
 * Job feature types
 * Re-exports database types and adds feature-specific types
 */

export type {
  Job,
  JobInsert,
  JobUpdate,
  JobStatusHistory,
  JobStatusHistoryInsert,
  JobStatusHistoryUpdate,
  JobStatus,
} from '@/lib/types'

import type { JobInsert, JobUpdate } from '@/lib/types'

// Feature-specific input types (for forms)
export type CreateJobInput = Omit<JobInsert, 'id' | 'created_at' | 'updated_at' | 'created_by'>

export type UpdateJobInput = Partial<JobUpdate>

