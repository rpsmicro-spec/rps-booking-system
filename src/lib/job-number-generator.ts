/**
 * Server-side utility for generating job numbers with idempotency
 * Uses database function with row-level locking to prevent duplicates
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generateJobNumber } from './job-number'
import type { Database } from '@/types/database.types'

type JobNumberSettingsRow = Database['public']['Tables']['job_number_settings']['Row']

/**
 * Generate and reserve the next job number atomically
 * Uses database function with SELECT FOR UPDATE to prevent race conditions
 */
export async function generateAndReserveJobNumber(): Promise<string> {
  const adminClient = createAdminClient()
  
  try {
    // Call the database function that atomically generates and increments the job number
    const { data, error } = await adminClient.rpc('generate_next_job_number')
    
    if (error) {
      console.error('Error generating job number:', error)
      // Fallback to timestamp-based number
      return `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    }
    
    if (data && typeof data === 'string') {
      return data
    }
    
    // Fallback if data is not a string
    return `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
  } catch (error) {
    console.error('Unexpected error generating job number:', error)
    // Fallback to timestamp-based number
    return `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
  }
}

/**
 * Get preview of next job number without incrementing (for form display)
 */
export async function getNextJobNumberPreview(): Promise<string | null> {
  const adminClient = createAdminClient()

  const { data: settingsData } = await adminClient
    .from('job_number_settings')
    .select('*')
    .limit(1)
    .maybeSingle() as { data: JobNumberSettingsRow | null; error: unknown }

  if (!settingsData) {
    return null
  }

  // Validate required fields
  if (
    !settingsData.prefix ||
    !settingsData.number_base ||
    settingsData.next_number === null
  ) {
    return null
  }

  return generateJobNumber({
    prefix: settingsData.prefix,
    number_base: settingsData.number_base as 'sequence' | 'year',
    next_number: settingsData.next_number,
    year: settingsData.year ?? undefined,
  })
}

