/**
 * Utility functions for generating Supabase Storage image URLs with transformations
 */

import { createClient } from '@/lib/supabase/client'

export interface ImageTransformOptions {
  width?: number
  height?: number
  quality?: number // 20-100, default 80
  resize?: 'cover' | 'contain' | 'fill'
  format?: 'origin' // Use 'origin' to disable automatic WebP optimization
}

/**
 * Extract file path from a Supabase Storage URL
 * @param url - Full Supabase Storage URL
 * @returns File path (bucket/path/to/file.jpg) or null if invalid
 */
function extractFilePath(url: string): string | null {
  // Handle public URLs: https://...supabase.co/storage/v1/object/public/bucket/path
  if (url.includes('/storage/v1/object/public/')) {
    const parts = url.split('/storage/v1/object/public/')
    if (parts.length > 1) {
      return parts[1] // Returns "bucket/path/to/file.jpg"
    }
  }
  // Handle local development URLs
  if (url.includes('/storage/v1/object/public/')) {
    const parts = url.split('/storage/v1/object/public/')
    if (parts.length > 1) {
      return parts[1]
    }
  }
  // If it's already a path (bucket/path), return as is
  if (!url.includes('://') && url.includes('/')) {
    return url
  }
  return null
}

/**
 * Get a transformed image URL from Supabase Storage
 * @param imageUrl - Full Supabase Storage URL or file path
 * @param transform - Transformation options
 * @returns Transformed image URL
 */
export function getTransformedImageUrl(
  imageUrl: string,
  transform?: ImageTransformOptions
): string {
  // For local blob URLs or localhost, return as is (no transformation)
  if (
    imageUrl.startsWith('blob:') ||
    imageUrl.startsWith('http://127.0.0.1') ||
    imageUrl.startsWith('http://localhost')
  ) {
    return imageUrl
  }

  // Extract file path from URL
  const filePath = extractFilePath(imageUrl)
  if (!filePath) {
    // If we can't extract path, return original URL
    return imageUrl
  }

  // If no transform options, return original URL
  if (!transform) {
    return imageUrl
  }

  // Get bucket and path
  const [bucket, ...pathParts] = filePath.split('/')
  const path = pathParts.join('/')

  // Generate transformed URL using Supabase SDK
  const supabase = createClient()
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: {
      width: transform.width,
      height: transform.height,
      quality: transform.quality,
      resize: transform.resize,
      format: transform.format,
    },
  })

  return publicUrl
}

/**
 * Get thumbnail URL for gallery display (optimized, smaller size)
 * @param imageUrl - Full Supabase Storage URL
 * @returns Thumbnail URL (400x400, quality 80, cover resize)
 */
export function getThumbnailUrl(imageUrl: string): string {
  return getTransformedImageUrl(imageUrl, {
    width: 400,
    height: 400,
    quality: 80,
    resize: 'cover',
  })
}

/**
 * Get full-size image URL for lightbox (higher quality, larger size)
 * @param imageUrl - Full Supabase Storage URL
 * @returns Full-size URL (max 1200px width, quality 90, contain resize)
 */
export function getFullSizeImageUrl(imageUrl: string): string {
  return getTransformedImageUrl(imageUrl, {
    width: 1200,
    quality: 90,
    resize: 'contain',
  })
}

