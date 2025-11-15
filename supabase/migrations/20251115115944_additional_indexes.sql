-- Additional indexes for query optimization

-- Index for filtering jobs by status and date
CREATE INDEX IF NOT EXISTS idx_jobs_status_updated 
  ON jobs(status, updated_at DESC) 
  WHERE deleted_at IS NULL;

-- Index for searching jobs by customer name
CREATE INDEX IF NOT EXISTS idx_jobs_customer_name 
  ON jobs USING gin(to_tsvector('english', customer_name))
  WHERE deleted_at IS NULL;

-- Index for searching jobs by job number
CREATE INDEX IF NOT EXISTS idx_jobs_job_number 
  ON jobs(job_number)
  WHERE deleted_at IS NULL;

-- Index for filtering by created_by
CREATE INDEX IF NOT EXISTS idx_jobs_created_by 
  ON jobs(created_by)
  WHERE deleted_at IS NULL;

-- Index for cleanup queries (jobs older than retention period)
CREATE INDEX IF NOT EXISTS idx_jobs_cleanup 
  ON jobs(status, updated_at)
  WHERE deleted_at IS NULL 
    AND archived_at IS NULL;

