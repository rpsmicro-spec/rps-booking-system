-- Job number settings table
CREATE TABLE IF NOT EXISTS job_number_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prefix TEXT DEFAULT '',
  number_base TEXT CHECK (number_base IN ('sequence', 'year')) DEFAULT 'sequence',
  next_number INTEGER DEFAULT 1,
  year INTEGER, -- For year-based numbering, store the current year
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings if none exist
INSERT INTO job_number_settings (id, prefix, number_base, next_number, year)
VALUES (
  uuid_generate_v4(),
  'JOB',
  'sequence',
  1,
  EXTRACT(YEAR FROM NOW())::INTEGER
)
ON CONFLICT DO NOTHING;

-- Create index
CREATE INDEX IF NOT EXISTS idx_job_number_settings_id ON job_number_settings(id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_number_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_job_number_settings_updated_at
  BEFORE UPDATE ON job_number_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_job_number_settings_updated_at();

-- RLS Policies
ALTER TABLE job_number_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Users can read job number settings"
  ON job_number_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow only owners and admins to update settings
CREATE POLICY "Owners and admins can update job number settings"
  ON job_number_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
    )
  );

-- Function to get and lock job settings for atomic job number generation
-- This uses SELECT FOR UPDATE to prevent race conditions
CREATE OR REPLACE FUNCTION get_and_lock_job_settings()
RETURNS TABLE (
  id UUID,
  prefix TEXT,
  number_base TEXT,
  next_number INTEGER,
  year INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jns.id,
    jns.prefix,
    jns.number_base,
    jns.next_number,
    jns.year,
    jns.created_at,
    jns.updated_at
  FROM job_number_settings jns
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  -- If no row found, return default
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      uuid_generate_v4()::UUID,
      'JOB'::TEXT,
      'sequence'::TEXT,
      1::INTEGER,
      EXTRACT(YEAR FROM NOW())::INTEGER,
      NOW(),
      NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_and_lock_job_settings() TO authenticated;

