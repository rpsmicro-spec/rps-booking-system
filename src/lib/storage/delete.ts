/**
 * Server-side utilities for deleting files from Supabase Storage
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseDatabase } from '@/types/types'

/**
 * Extract file path from a Supabase Storage URL
 */
export function extractFilePath(url: string, bucket: string): string | null {
  // Handle public URLs: https://...supabase.co/storage/v1/object/public/bucket/path
  if (url.includes('/storage/v1/object/public/')) {
    const parts = url.split('/storage/v1/object/public/')
    if (parts.length > 1) {
      const bucketAndPath = parts[1]
      if (bucketAndPath.startsWith(`${bucket}/`)) {
        return bucketAndPath.substring(bucket.length + 1)
      }
    }
  }
  // Handle signed URLs or direct paths
  if (url.startsWith(bucket + '/') || !url.includes('://')) {
    return url.startsWith(bucket + '/') ? url.substring(bucket.length + 1) : url
  }
  return null
}

/**
 * Delete a file from Supabase Storage (server-side).
 * Pass an optional Supabase client (e.g. admin) for cron/system use without a user session.
 */
export async function deleteStorageFile(
  filePath: string,
  bucket: 'job-photos' | 'invoices' | 'temp-uploads',
  supabaseClient?: SupabaseClient<SupabaseDatabase>
): Promise<void> {
  const supabase = supabaseClient ?? (await createClient())
  const path = extractFilePath(filePath, bucket)

  if (!path) {
    console.warn(`Could not extract path from URL: ${filePath}`)
    return
  }

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    console.error(`Failed to delete file ${filePath} from ${bucket}:`, error)
    // Don't throw - we don't want file deletion failures to break job deletion
  }
}

/**
 * Delete multiple files from Supabase Storage (server-side).
 * Pass an optional Supabase client (e.g. admin) for cron/system use without a user session.
 */
export async function deleteStorageFiles(
  filePaths: string[],
  bucket: 'job-photos' | 'invoices' | 'temp-uploads',
  supabaseClient?: SupabaseClient<SupabaseDatabase>
): Promise<void> {
  const supabase = supabaseClient ?? (await createClient())
  const paths = filePaths
    .map((url) => extractFilePath(url, bucket))
    .filter((path): path is string => path !== null)

  if (paths.length === 0) {
    return
  }

  const { error } = await supabase.storage.from(bucket).remove(paths)

  if (error) {
    console.error(`Failed to delete files from ${bucket}:`, error)
    // Don't throw - we don't want file deletion failures to break job deletion
  }
}

