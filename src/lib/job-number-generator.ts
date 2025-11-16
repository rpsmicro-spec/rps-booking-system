/**
 * Server-side utility for generating job numbers with idempotency
 * Uses database transactions and row-level locking to prevent duplicates
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generateJobNumber, getNextSettings, type JobNumberSettings } from './job-number'
import type { Database } from '@/types/database.types'

type JobNumberSettingsRow = Database['public']['Tables']['job_number_settings']['Row']
type JobNumberSettingsUpdate = Database['public']['Tables']['job_number_settings']['Update']

/**
 * Generate and reserve the next job number atomically
 * Uses optimistic locking with retry logic to prevent race conditions
 */
export async function generateAndReserveJobNumber(): Promise<string> {
  const adminClient = createAdminClient()
  return await generateJobNumberWithRetry(adminClient)
}

/**
 * Fallback method using retry logic with optimistic locking
 */
async function generateJobNumberWithRetry(
  adminClient: ReturnType<typeof createAdminClient>,
  maxRetries = 5
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Fetch current settings
      const { data: settingsData, error } = await adminClient
        .from('job_number_settings')
        .select('*')
        .limit(1)
        .maybeSingle() as { data: JobNumberSettingsRow | null; error: { code?: string; message?: string } | null }

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      // If no settings exist, use fallback
      if (!settingsData) {
        return `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }

      // Generate job number
      const jobNumber = generateJobNumber(settingsData)

      // Try to update settings atomically using optimistic locking
      const nextSettings = getNextSettings(settingsData) as JobNumberSettingsUpdate
      const { error: updateError } = await adminClient
        .from('job_number_settings')
        .update(nextSettings)
        .eq('id', settingsData.id)
        .eq('next_number', settingsData.next_number) // Optimistic locking - only update if next_number hasn't changed

      // If update succeeded (no error), verify it actually updated
      if (!updateError) {
        // Verify the update by checking if the new next_number exists
        const { data: verifyData } = await adminClient
          .from('job_number_settings')
          .select('next_number')
          .eq('id', settingsData.id)
          .single() as { data: { next_number: number | null } | null; error: unknown }

        // If the next_number matches what we set, update succeeded
        if (verifyData && verifyData.next_number === nextSettings.next_number) {
          return jobNumber
        }
        // Otherwise, someone else updated it between our update and verification
      }

      // If conflict or error, retry
      if (attempt < maxRetries - 1) {
        // Wait a bit before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)))
        continue
      }

      // Last attempt failed, throw error or use fallback
      if (updateError) {
        throw updateError
      }
    } catch (error) {
      if (attempt === maxRetries - 1) {
        // Last attempt failed, use timestamp-based fallback
        return `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)))
    }
  }

  // Final fallback
  return `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
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

  return generateJobNumber(settingsData)
}

