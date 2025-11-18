/**
 * Storage cleanup utilities
 */

import { createClient } from '@/lib/supabase/server'
import { deleteStorageFile, deleteStorageFiles } from './delete'
import type { Json } from '@/types/database.types'

interface CleanupResult {
  deletedFiles: number
  errors: number
  details: {
    photos: number
    videos: number
    invoices: number
    temp: number
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
 * Clean up old job photos (1 month after delivery/completion)
 * Images only - videos are handled separately with shorter retention
 */
async function cleanupOldPhotos(): Promise<number> {
  const supabase = await createClient()
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  // Find completed jobs older than 1 month
  const { data: oldJobs } = await supabase
    .from('jobs')
    .select('id, before_photos, after_photos, updated_at, status')
    .eq('status', 'completed')
    .lt('updated_at', oneMonthAgo.toISOString())
    .is('deleted_at', null)

  if (!oldJobs || oldJobs.length === 0) {
    return 0
  }

  let deletedCount = 0
  for (const job of oldJobs) {
    const allMedia = [
      ...(job.before_photos || []),
      ...(job.after_photos || []),
    ]

    // Filter to only images (not videos)
    const photos = allMedia.filter((url) => !isVideoFile(url))

    if (photos.length > 0) {
      try {
        await deleteStorageFiles(photos, 'job-photos')
        deletedCount += photos.length
      } catch (error) {
        console.error(`Failed to delete photos for job ${job.id}:`, error)
      }
    }
  }

  return deletedCount
}

/**
 * Clean up old job videos (3 days after delivery/completion)
 */
async function cleanupOldVideos(): Promise<number> {
  const supabase = await createClient()
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  // Find completed jobs older than 3 days
  const { data: oldJobs } = await supabase
    .from('jobs')
    .select('id, before_photos, after_photos, updated_at, status')
    .eq('status', 'completed')
    .lt('updated_at', threeDaysAgo.toISOString())
    .is('deleted_at', null)

  if (!oldJobs || oldJobs.length === 0) {
    return 0
  }

  let deletedCount = 0
  for (const job of oldJobs) {
    const allMedia = [
      ...(job.before_photos || []),
      ...(job.after_photos || []),
    ]

    // Filter to only videos
    const videos = allMedia.filter((url) => isVideoFile(url))

    if (videos.length > 0) {
      try {
        await deleteStorageFiles(videos, 'job-photos')
        deletedCount += videos.length
      } catch (error) {
        console.error(`Failed to delete videos for job ${job.id}:`, error)
      }
    }
  }

  return deletedCount
}

/**
 * Clean up old invoices (1 week after delivery/completion)
 */
async function cleanupOldInvoices(): Promise<number> {
  const supabase = await createClient()
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Find completed jobs older than 1 week
  const { data: oldJobs } = await supabase
    .from('jobs')
    .select('id, invoice_file_path, updated_at, status')
    .eq('status', 'completed')
    .lt('updated_at', oneWeekAgo.toISOString())
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
 * Clean up temp uploads (3 days old)
 */
async function cleanupTempUploads(): Promise<number> {
  const supabase = await createClient()
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

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
      return fileDate < threeDaysAgo
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
      videos: 0,
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
    result.details.videos = await cleanupOldVideos()
    result.deletedFiles += result.details.videos
  } catch (error) {
    console.error('Error cleaning up videos:', error)
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
    metadata: result as unknown as Json,
  })

  return result
}

