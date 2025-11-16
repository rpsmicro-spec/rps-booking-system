/**
 * Server-side utilities for generating signed URLs for private bucket files
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Extract file path from a Supabase Storage URL
 * @param url - Full Supabase Storage URL or file path
 * @returns File path (path/to/file.pdf) or null if invalid
 */
function extractFilePath(url: string, bucket: string): string | null {
  // Handle public URLs: https://...supabase.co/storage/v1/object/public/bucket/path
  if (url.includes('/storage/v1/object/public/')) {
    const parts = url.split('/storage/v1/object/public/')
    if (parts.length > 1) {
      const bucketAndPath = parts[1]
      if (bucketAndPath.startsWith(`${bucket}/`)) {
        return bucketAndPath.substring(bucket.length + 1) // Remove bucket name and leading slash
      }
    }
  }
  // Handle authenticated URLs: https://...supabase.co/storage/v1/object/authenticated/bucket/path
  if (url.includes('/storage/v1/object/authenticated/')) {
    const parts = url.split('/storage/v1/object/authenticated/')
    if (parts.length > 1) {
      const bucketAndPath = parts[1]
      if (bucketAndPath.startsWith(`${bucket}/`)) {
        return bucketAndPath.substring(bucket.length + 1)
      }
    }
  }
  // If it's already a path (path/to/file.pdf), return as is
  if (!url.includes('://') && !url.startsWith(bucket + '/')) {
    return url
  }
  // If it's bucket/path format, extract just the path
  if (url.startsWith(`${bucket}/`)) {
    return url.substring(bucket.length + 1)
  }
  return null
}

/**
 * Generate a signed URL for a private bucket file
 * @param filePath - File path or full URL
 * @param bucket - Storage bucket name
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or null if error
 */
export async function getSignedUrl(
  filePath: string,
  bucket: 'invoices' | 'job-photos' | 'temp-uploads',
  expiresIn: number = 3600
): Promise<string | null> {
  if (!filePath) {
    return null
  }

  const supabase = await createClient()
  
  // Extract file path from URL if needed
  const path = extractFilePath(filePath, bucket)
  if (!path) {
    console.error(`Failed to extract file path from: ${filePath}`)
    return null
  }

  // Generate signed URL
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error(`Failed to create signed URL for ${path}:`, error)
    return null
  }

  return data.signedUrl
}

