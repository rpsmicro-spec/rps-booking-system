-- Update job-photos bucket file size limit to 25MB for videos

UPDATE storage.buckets
SET file_size_limit = 26214400 -- 25MB in bytes
WHERE id = 'job-photos';

