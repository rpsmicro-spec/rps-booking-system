/**
 * Upload utilities for Supabase Storage
 */

import { createClient } from '@/lib/supabase/client'
import { compressImage, validateImageFile } from './image-optimization'

export interface UploadOptions {
  bucket: 'job-photos' | 'invoices' | 'temp-uploads'
  folder?: string
  compress?: boolean
  maxSizeMB?: number
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param options - Upload options
 * @returns A Promise that resolves to the public URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<string> {
  const { bucket, folder = '', compress = false, maxSizeMB = 5 } = options

  // Validate file based on bucket type
  if (bucket === 'job-photos') {
    const validationError = validateImageFile(file, maxSizeMB)
    if (validationError) {
      throw new Error(validationError)
    }
  } else if (bucket === 'invoices') {
    // Validate PDF file size (5MB max)
    const maxSizeBytes = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSizeBytes) {
      throw new Error('File size exceeds 5MB. Please choose a smaller file.')
    }
    if (file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Please upload a PDF file.')
    }
  }

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop() || 'jpg'
  const fileName = `${timestamp}-${randomString}.${fileExtension}`
  const filePath = folder ? `${folder}/${fileName}` : fileName

  // Prepare file for upload
  let fileToUpload: File = file
  
  if (compress && bucket === 'job-photos') {
    // Compress image and convert Blob back to File
    // Supabase standard upload expects a File object
    const compressedBlob = await compressImage(file)
    fileToUpload = new File([compressedBlob], file.name, {
      type: file.type || 'image/jpeg',
      lastModified: Date.now(),
    })
  }

  // Upload using Supabase standard upload method
  // Pass File object directly as per Supabase documentation
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileToUpload, {
      upsert: false,
      contentType: file.type || 'image/jpeg',
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get URL based on bucket type
  if (bucket === 'job-photos') {
    // Public bucket - use getPublicUrl (conventional way per Supabase docs)
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return publicUrl
  } else {
    // Private bucket (invoices) - store the file path, not the URL
    // Signed URLs will be generated server-side when needed for display
    // Return the file path in format: "bucket/path/to/file.pdf"
    // This allows us to extract the path later for signed URL generation
    return `${bucket}/${filePath}`
  }
}

/**
 * Upload multiple files
 * @param files - Array of files to upload
 * @param options - Upload options
 * @returns A Promise that resolves to an array of public URLs
 */
export async function uploadFiles(
  files: File[],
  options: UploadOptions
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadFile(file, options))
  return Promise.all(uploadPromises)
}

/**
 * Delete a file from Supabase Storage
 * @param filePath - The path of the file to delete
 * @param bucket - The storage bucket
 */
export async function deleteFile(
  filePath: string,
  bucket: 'job-photos' | 'invoices' | 'temp-uploads'
): Promise<void> {
  const supabase = createClient()

  // Extract path from URL if full URL is provided
  let path = filePath
  if (filePath.includes('/storage/v1/object/public/')) {
    const parts = filePath.split('/storage/v1/object/public/')
    if (parts.length > 1) {
      const bucketAndPath = parts[1]
      path = bucketAndPath.substring(bucket.length + 1) // Remove bucket name and leading slash
    }
  }

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

/**
 * Delete multiple files
 * @param filePaths - Array of file paths to delete
 * @param bucket - The storage bucket
 */
export async function deleteFiles(
  filePaths: string[],
  bucket: 'job-photos' | 'invoices' | 'temp-uploads'
): Promise<void> {
  const deletePromises = filePaths.map((path) => deleteFile(path, bucket))
  await Promise.all(deletePromises)
}

