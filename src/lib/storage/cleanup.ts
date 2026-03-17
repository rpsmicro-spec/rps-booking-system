/**
 * Storage cleanup utilities
 * Uses admin client so cron can run without a user session (bypasses RLS).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { deleteStorageFile, deleteStorageFiles, extractFilePath } from './delete'
import type { Json } from '@/types/database.types'

interface CleanupResult {
  deletedFiles: number
  errors: number
  details: {
    photos: number
    videos: number
    invoices: number
    temp: number
    orphans: number
  }
}

/**
 * Helper to check if a URL is a video file
 */
function isVideoFile(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext.toLowerCase()))
}

/**
 * Get the date each job reached completed/delivered (from status history).
 * Used for retention so edits don't reset the cleanup window.
 */
async function getJobCompletedDeliveredAt(
  supabase: Awaited<ReturnType<typeof createAdminClient>>
): Promise<Map<string, Date>> {
  const { data: rows } = await supabase
    .from('job_status_history')
    .select('job_id, changed_at')
    .in('new_status', ['completed', 'delivered'])

  const byJob = new Map<string, Date>()
  for (const row of rows || []) {
    if (!row.job_id || !row.changed_at) continue
    const existing = byJob.get(row.job_id)
    const at = new Date(row.changed_at)
    if (!existing || at > existing) byJob.set(row.job_id, at)
  }
  return byJob
}

/**
 * Clean up old job photos (1 month after job reached completed/delivered)
 * Uses status history date so later edits don't reset retention.
 * Images only - videos are handled separately with shorter retention
 */
async function cleanupOldPhotos(supabase: Awaited<ReturnType<typeof createAdminClient>>): Promise<number> {
  const oneMonthAgo = new Date()
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)

  const completedAtByJob = await getJobCompletedDeliveredAt(supabase)

  // Completed/delivered jobs that are not deleted
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, before_photos, after_photos, status, updated_at')
    .in('status', ['completed', 'delivered'])
    .is('deleted_at', null)

  if (!jobs || jobs.length === 0) {
    return 0
  }

  // Keep only jobs that reached completed/delivered more than 30 days ago.
  // Use status history date when present; fall back to updated_at for old jobs with no history.
  const oldJobs = jobs.filter((job) => {
    const at = completedAtByJob.get(job.id) ?? (job.updated_at ? new Date(job.updated_at) : null)
    return at ? at < oneMonthAgo : false
  })

  let deletedCount = 0
  for (const job of oldJobs) {
    const beforePhotos = job.before_photos || []
    const afterPhotos = job.after_photos || []

    // Filter to only images (not videos)
    const photosToDelete = [
      ...beforePhotos.filter((url) => !isVideoFile(url)),
      ...afterPhotos.filter((url) => !isVideoFile(url)),
    ]

    if (photosToDelete.length > 0) {
      try {
        await deleteStorageFiles(photosToDelete, 'job-photos', supabase)
        deletedCount += photosToDelete.length
        // Clear deleted photo refs; keep video refs
        const beforeRemaining = beforePhotos.filter(isVideoFile)
        const afterRemaining = afterPhotos.filter(isVideoFile)
        await supabase
          .from('jobs')
          .update({ before_photos: beforeRemaining, after_photos: afterRemaining })
          .eq('id', job.id)
      } catch (error) {
        console.error(`Failed to delete photos for job ${job.id}:`, error)
      }
    }
  }

  return deletedCount
}

/**
 * Clean up old job videos (3 days after job reached completed/delivered)
 * Uses status history date so later edits don't reset retention.
 */
async function cleanupOldVideos(supabase: Awaited<ReturnType<typeof createAdminClient>>): Promise<number> {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const completedAtByJob = await getJobCompletedDeliveredAt(supabase)

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, before_photos, after_photos, status, updated_at')
    .in('status', ['completed', 'delivered'])
    .is('deleted_at', null)

  if (!jobs || jobs.length === 0) {
    return 0
  }

  const oldJobs = jobs.filter((job) => {
    const at = completedAtByJob.get(job.id) ?? (job.updated_at ? new Date(job.updated_at) : null)
    return at ? at < threeDaysAgo : false
  })

  let deletedCount = 0
  for (const job of oldJobs) {
    const beforePhotos = job.before_photos || []
    const afterPhotos = job.after_photos || []

    const videosToDelete = [
      ...beforePhotos.filter(isVideoFile),
      ...afterPhotos.filter(isVideoFile),
    ]

    if (videosToDelete.length > 0) {
      try {
        await deleteStorageFiles(videosToDelete, 'job-photos', supabase)
        deletedCount += videosToDelete.length
        const beforeRemaining = beforePhotos.filter((url) => !isVideoFile(url))
        const afterRemaining = afterPhotos.filter((url) => !isVideoFile(url))
        await supabase
          .from('jobs')
          .update({ before_photos: beforeRemaining, after_photos: afterRemaining })
          .eq('id', job.id)
      } catch (error) {
        console.error(`Failed to delete videos for job ${job.id}:`, error)
      }
    }
  }

  return deletedCount
}

/**
 * Clean up old invoices (1 week after job reached completed/delivered)
 * Uses status history date so later edits don't reset retention.
 */
async function cleanupOldInvoices(supabase: Awaited<ReturnType<typeof createAdminClient>>): Promise<number> {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const completedAtByJob = await getJobCompletedDeliveredAt(supabase)

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, invoice_file_path, invoice_url, status, updated_at')
    .in('status', ['completed', 'delivered'])
    .is('deleted_at', null)
    .not('invoice_file_path', 'is', null)

  if (!jobs || jobs.length === 0) {
    return 0
  }

  const oldJobs = jobs.filter((job) => {
    const at = completedAtByJob.get(job.id) ?? (job.updated_at ? new Date(job.updated_at) : null)
    return at ? at < oneWeekAgo : false
  })

  let deletedCount = 0
  for (const job of oldJobs) {
    if (job.invoice_file_path) {
      try {
        await deleteStorageFile(job.invoice_file_path, 'invoices', supabase)
        deletedCount++
        await supabase
          .from('jobs')
          .update({ invoice_file_path: null, invoice_url: null })
          .eq('id', job.id)
      } catch (error) {
        console.error(`Failed to delete invoice for job ${job.id}:`, error)
      }
    }
  }

  return deletedCount
}

/**
 * Clean up temp uploads (3 days old)
 */
async function cleanupTempUploads(supabase: Awaited<ReturnType<typeof createAdminClient>>): Promise<number> {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  let totalDeleted = 0
  const PAGE_SIZE = 1000

  // Paginate through all temp files in case there are more than 1000
  while (true) {
    const { data: files, error } = await supabase.storage
      .from('temp-uploads')
      .list('', {
        limit: PAGE_SIZE,
        sortBy: { column: 'created_at', order: 'asc' },
      })

    if (error || !files) {
      console.error('Failed to list temp files:', error)
      break
    }

    const filesToDelete = files
      .filter((file) => {
        if (!file.created_at) return false
        const fileDate = new Date(file.created_at)
        return fileDate < threeDaysAgo
      })
      .map((file) => file.name)

    // No more stale files to delete
    if (filesToDelete.length === 0) {
      break
    }

    try {
      const { error: deleteError } = await supabase.storage
        .from('temp-uploads')
        .remove(filesToDelete)

      if (deleteError) {
        console.error('Failed to delete temp files:', deleteError)
        break
      }

      totalDeleted += filesToDelete.length
    } catch (error) {
      console.error('Error cleaning up temp files:', error)
      break
    }

    // If we got fewer files than page size, we've reached the end
    if (files.length < PAGE_SIZE) {
      break
    }
  }

  return totalDeleted
}

const ORPHAN_RETENTION_DAYS = 7

/**
 * Delete files in job-photos that are no longer referenced by any job.
 * Files become orphaned when photos are replaced during edits, or when a job
 * is deleted but storage removal fails silently. Uses a 7-day grace period
 * to avoid deleting files mid-upload.
 */
async function cleanupOrphanedFiles(
  supabase: Awaited<ReturnType<typeof createAdminClient>>
): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - ORPHAN_RETENTION_DAYS)

  const { data: jobs } = await supabase
    .from('jobs')
    .select('before_photos, after_photos')

  const referencedFiles = new Set<string>()
  for (const job of jobs || []) {
    for (const url of [...(job.before_photos || []), ...(job.after_photos || [])]) {
      const path = extractFilePath(url, 'job-photos')
      if (path) referencedFiles.add(path)
    }
  }

  const orphanNames: string[] = []
  const PAGE_SIZE = 1000
  let offset = 0

  while (true) {
    const { data: files, error } = await supabase.storage
      .from('job-photos')
      .list('', {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: 'created_at', order: 'asc' },
      })

    if (error || !files) {
      console.error('Failed to list job-photos files:', error)
      break
    }

    for (const file of files) {
      if (!file.created_at) continue
      const fileDate = new Date(file.created_at)
      if (fileDate < cutoff && !referencedFiles.has(file.name)) {
        orphanNames.push(file.name)
      }
    }

    if (files.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  const DELETE_BATCH = 100
  let totalDeleted = 0

  for (let i = 0; i < orphanNames.length; i += DELETE_BATCH) {
    const batch = orphanNames.slice(i, i + DELETE_BATCH)
    try {
      const { error: deleteError } = await supabase.storage
        .from('job-photos')
        .remove(batch)

      if (deleteError) {
        console.error('Failed to delete orphaned files batch:', deleteError)
        continue
      }
      totalDeleted += batch.length
    } catch (error) {
      console.error('Error deleting orphaned files batch:', error)
    }
  }

  return totalDeleted
}

/**
 * Run all cleanup operations
 * Uses admin client so cron runs without a user session (storage and jobs RLS bypassed).
 */
export async function runStorageCleanup(): Promise<CleanupResult> {
  const supabase = createAdminClient()
  const result: CleanupResult = {
    deletedFiles: 0,
    errors: 0,
    details: {
      photos: 0,
      videos: 0,
      invoices: 0,
      temp: 0,
      orphans: 0,
    },
  }

  try {
    result.details.photos = await cleanupOldPhotos(supabase)
    result.deletedFiles += result.details.photos
  } catch (error) {
    console.error('Error cleaning up photos:', error)
    result.errors++
  }

  try {
    result.details.videos = await cleanupOldVideos(supabase)
    result.deletedFiles += result.details.videos
  } catch (error) {
    console.error('Error cleaning up videos:', error)
    result.errors++
  }

  try {
    result.details.invoices = await cleanupOldInvoices(supabase)
    result.deletedFiles += result.details.invoices
  } catch (error) {
    console.error('Error cleaning up invoices:', error)
    result.errors++
  }

  try {
    result.details.temp = await cleanupTempUploads(supabase)
    result.deletedFiles += result.details.temp
  } catch (error) {
    console.error('Error cleaning up temp files:', error)
    result.errors++
  }

  try {
    result.details.orphans = await cleanupOrphanedFiles(supabase)
    result.deletedFiles += result.details.orphans
  } catch (error) {
    console.error('Error cleaning up orphaned files:', error)
    result.errors++
  }

  // Log cleanup operation
  const { error: logError } = await supabase.from('cleanup_log').insert({
    cleanup_type: 'storage',
    resource_type: 'files',
    reason: 'Automated cleanup',
    metadata: result as unknown as Json,
  })
  if (logError) {
    console.error('Failed to write cleanup_log:', logError)
    result.errors++
  }

  return result
}

