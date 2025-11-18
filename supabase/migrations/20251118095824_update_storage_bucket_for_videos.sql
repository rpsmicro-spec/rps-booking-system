-- Update job-photos bucket to allow video files

-- Update the bucket to allow video MIME types
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/x-m4v'
],
file_size_limit = 104857600 -- 100MB in bytes
WHERE id = 'job-photos';

