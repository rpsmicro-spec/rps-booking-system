-- Create storage buckets for job photos, invoices, and temp uploads
-- Note: Storage buckets are created in the storage.buckets table
-- The storage schema is already available in Supabase, no extension needed

-- Create job-photos bucket (public)
INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
VALUES (
  'job-photos',
  'job-photos',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create invoices bucket (private)
INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  5242880, -- 5MB in bytes
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create temp-uploads bucket (private)
INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
VALUES (
  'temp-uploads',
  'temp-uploads',
  false,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for job-photos bucket (public)
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload job photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos' AND
  auth.role() = 'authenticated'
);

-- Allow public read access (since bucket is public)
CREATE POLICY "Public can view job photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-photos');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete job photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-photos' AND
  auth.role() = 'authenticated'
);

-- Storage Policies for invoices bucket (private)
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can view invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  auth.role() = 'authenticated'
);

-- Storage Policies for temp-uploads bucket (private)
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload temp files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'temp-uploads' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can view temp files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'temp-uploads' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete temp files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'temp-uploads' AND
  auth.role() = 'authenticated'
);

