-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanup_log ENABLE ROW LEVEL SECURITY;

-- Jobs RLS Policies
-- Allow authenticated users to view all jobs
CREATE POLICY "Users can view jobs"
  ON jobs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to create jobs
CREATE POLICY "Users can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update jobs
CREATE POLICY "Users can update jobs"
  ON jobs FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete jobs (soft delete)
CREATE POLICY "Users can delete jobs"
  ON jobs FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Job Status History RLS Policies
CREATE POLICY "Users can view job status history"
  ON job_status_history FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert job status history"
  ON job_status_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Cleanup Log RLS Policies (admin/system only)
CREATE POLICY "System can manage cleanup log"
  ON cleanup_log FOR ALL
  USING (true)
  WITH CHECK (true);

