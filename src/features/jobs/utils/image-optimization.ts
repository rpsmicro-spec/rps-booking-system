/**
 * Image optimization utilities for compressing images before upload
 */

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1200, // Reduced from 1920 for better compression
  maxHeight: 1200, // Reduced from 1920 for better compression
  quality: 0.7, // Reduced from 0.8 for better compression
  maxSizeKB: 250, // Reduced from 500KB to 250KB target
}

/**
 * Compress an image file to reduce file size
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns A Promise that resolves to a compressed Blob
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width
        let height = img.height

        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(
            opts.maxWidth / width,
            opts.maxHeight / height
          )
          width = width * ratio
          height = height * ratio
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Try WebP first (better compression), fallback to JPEG
        const tryWebP = () => {
          canvas.toBlob(
            (webpBlob) => {
              if (webpBlob) {
                const sizeKB = webpBlob.size / 1024
                if (sizeKB <= opts.maxSizeKB) {
                  resolve(webpBlob)
                  return
                }
                // If WebP is still too large, try with lower quality
                if (opts.quality > 0.3) {
                  canvas.toBlob(
                    (lowerQualityWebP) => {
                      if (lowerQualityWebP) {
                        resolve(lowerQualityWebP)
                      } else {
                        tryJPEG()
                      }
                    },
                    'image/webp',
                    Math.max(0.3, opts.quality - 0.15)
                  )
                } else {
                  tryJPEG()
                }
              } else {
                tryJPEG()
              }
            },
            'image/webp',
            opts.quality
          )
        }

        const tryJPEG = () => {
          canvas.toBlob(
            (jpegBlob) => {
              if (!jpegBlob) {
                reject(new Error('Failed to compress image'))
                return
              }

              // If still too large, reduce quality further
              const sizeKB = jpegBlob.size / 1024
              if (sizeKB > opts.maxSizeKB && opts.quality > 0.3) {
                // Recursively compress with lower quality
                canvas.toBlob(
                  (lowerQualityBlob) => {
                    if (!lowerQualityBlob) {
                      resolve(jpegBlob)
                      return
                    }
                    resolve(lowerQualityBlob)
                  },
                  'image/jpeg',
                  Math.max(0.3, opts.quality - 0.2)
                )
              } else {
                resolve(jpegBlob)
              }
            },
            'image/jpeg',
            opts.quality
          )
        }

        // Try WebP first (better compression), fallback to JPEG if not supported
        tryWebP()
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      if (typeof e.target?.result === 'string') {
        img.src = e.target.result
      } else {
        reject(new Error('Invalid file data'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): string | null {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return `File size exceeds ${maxSizeMB}MB. Please compress the image or choose a smaller file.`
  }

  return null
}

