/**
 * Storage cleanup utilities
 */

import { createClient } from '@/lib/supabase/server'
import { deleteStorageFile, deleteStorageFiles } from './delete'

interface CleanupResult {
  deletedFiles: number
  errors: number
  details: {
    photos: number
    invoices: number
    temp: number
  }
}

/**
 * Clean up old job photos (1 year after completion)
 */
async function cleanupOldPhotos(): Promise<number> {
  const supabase = await createClient()
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  // Find completed jobs older than 1 year
  const { data: oldJobs } = await supabase
    .from('jobs')
    .select('id, before_photos, after_photos, updated_at, status')
    .eq('status', 'completed')
    .lt('updated_at', oneYearAgo.toISOString())
    .is('deleted_at', null)

  if (!oldJobs || oldJobs.length === 0) {
    return 0
  }

  let deletedCount = 0
  for (const job of oldJobs) {
    const allPhotos = [
      ...(job.before_photos || []),
      ...(job.after_photos || []),
    ]

    if (allPhotos.length > 0) {
      try {
        await deleteStorageFiles(allPhotos, 'job-photos')
        deletedCount += allPhotos.length
      } catch (error) {
        console.error(`Failed to delete photos for job ${job.id}:`, error)
      }
    }
  }

  return deletedCount
}

/**
 * Clean up old invoices (7 years after completion for tax compliance)
 */
async function cleanupOldInvoices(): Promise<number> {
  const supabase = await createClient()
  const sevenYearsAgo = new Date()
  sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7)

  // Find completed jobs older than 7 years
  const { data: oldJobs } = await supabase
    .from('jobs')
    .select('id, invoice_file_path, updated_at, status')
    .eq('status', 'completed')
    .lt('updated_at', sevenYearsAgo.toISOString())
    .is('deleted_at', null)
    .not('invoice_file_path', 'is', null)

  if (!oldJobs || oldJobs.length === 0) {
    return 0
  }

  let deletedCount = 0
  for (const job of oldJobs) {
    if (job.invoice_file_path) {
      try {
        await deleteStorageFile(job.invoice_file_path, 'invoices')
        deletedCount++
      } catch (error) {
        console.error(`Failed to delete invoice for job ${job.id}:`, error)
      }
    }
  }

  return deletedCount
}

/**
 * Clean up temp uploads (7 days old)
 */
async function cleanupTempUploads(): Promise<number> {
  const supabase = await createClient()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // List all files in temp-uploads bucket
  const { data: files, error } = await supabase.storage
    .from('temp-uploads')
    .list('', {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'asc' },
    })

  if (error || !files) {
    console.error('Failed to list temp files:', error)
    return 0
  }

  const filesToDelete = files
    .filter((file) => {
      if (!file.created_at) return false
      const fileDate = new Date(file.created_at)
      return fileDate < sevenDaysAgo
    })
    .map((file) => file.name)

  if (filesToDelete.length === 0) {
    return 0
  }

  try {
    const { error: deleteError } = await supabase.storage
      .from('temp-uploads')
      .remove(filesToDelete)

    if (deleteError) {
      console.error('Failed to delete temp files:', deleteError)
      return 0
    }

    return filesToDelete.length
  } catch (error) {
    console.error('Error cleaning up temp files:', error)
    return 0
  }
}

/**
 * Run all cleanup operations
 */
export async function runStorageCleanup(): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedFiles: 0,
    errors: 0,
    details: {
      photos: 0,
      invoices: 0,
      temp: 0,
    },
  }

  try {
    result.details.photos = await cleanupOldPhotos()
    result.deletedFiles += result.details.photos
  } catch (error) {
    console.error('Error cleaning up photos:', error)
    result.errors++
  }

  try {
    result.details.invoices = await cleanupOldInvoices()
    result.deletedFiles += result.details.invoices
  } catch (error) {
    console.error('Error cleaning up invoices:', error)
    result.errors++
  }

  try {
    result.details.temp = await cleanupTempUploads()
    result.deletedFiles += result.details.temp
  } catch (error) {
    console.error('Error cleaning up temp files:', error)
    result.errors++
  }

  // Log cleanup operation
  const supabase = await createClient()
  await supabase.from('cleanup_log').insert({
    cleanup_type: 'storage',
    resource_type: 'files',
    reason: 'Automated cleanup',
    metadata: result as Record<string, unknown>,
  })

  return result
}

