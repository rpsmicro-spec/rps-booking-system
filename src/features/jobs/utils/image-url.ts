/**
 * Utility functions for image URLs from Supabase Storage.
 *
 * Image optimization is handled by Next.js <Image> component, so these
 * helpers simply return the original public URL. Previously they generated
 * Supabase /render/image/ transform URLs which caused 502 errors when
 * Next.js tried to proxy-optimize them (double transformation).
 */

/**
 * Get thumbnail URL for gallery display.
 * Returns the original public URL — Next.js <Image> handles resizing.
 */
export function getThumbnailUrl(imageUrl: string): string {
  return imageUrl
}

/**
 * Get full-size image URL for lightbox display.
 * Returns the original public URL.
 */
export function getFullSizeImageUrl(imageUrl: string): string {
  return imageUrl
}

