-- Add RLS policy to allow authenticated users to delete jobs
-- This enables hard deletion of jobs from the database

CREATE POLICY "Users can delete jobs"
  ON jobs FOR DELETE
  USING ((select auth.role()) = 'authenticated');

