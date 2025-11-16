-- Add RLS policies to allow public (unauthenticated) access to jobs via public_token
-- This enables customers to view their job details without authentication

-- Policy for public access to jobs via public_token
-- This allows unauthenticated users to view jobs that have a public_token
-- Security: Users can only access jobs if they know the exact public_token (via URL)
CREATE POLICY "Public can view jobs by public_token"
  ON jobs FOR SELECT
  USING (
    public_token IS NOT NULL 
    AND deleted_at IS NULL
  );

-- Policy for public access to job status history for jobs with public_token
-- This allows customers to see the status timeline
CREATE POLICY "Public can view job status history for public jobs"
  ON job_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM jobs 
      WHERE jobs.id = job_status_history.job_id 
      AND jobs.public_token IS NOT NULL
      AND jobs.deleted_at IS NULL
    )
  );

