-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  address TEXT,
  contact_number TEXT,
  email TEXT,
  material_type TEXT,
  booking_date TIMESTAMPTZ NOT NULL,
  delivery_date TIMESTAMPTZ,
  special_requirements TEXT,
  status TEXT CHECK (status IN ('collected', 'in_progress', 'completed', 'delivered')) DEFAULT 'collected',
  before_photos TEXT[] DEFAULT '{}',
  after_photos TEXT[] DEFAULT '{}',
  invoice_url TEXT,
  invoice_file_path TEXT,
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Job status history table
CREATE TABLE IF NOT EXISTS job_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cleanup log table
CREATE TABLE IF NOT EXISTS cleanup_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cleanup_type TEXT NOT NULL,
  resource_id UUID,
  resource_type TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  metadata JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at ON jobs(updated_at);
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON jobs(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_retention ON jobs(updated_at, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_job_status_history_job_id ON job_status_history(job_id);
CREATE INDEX IF NOT EXISTS idx_job_status_history_changed_at ON job_status_history(changed_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

