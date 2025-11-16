-- Add public_token column to jobs table for secure public access
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;

-- Create index on public_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_jobs_public_token ON jobs(public_token) WHERE public_token IS NOT NULL;

-- Function to generate a secure random token
CREATE OR REPLACE FUNCTION generate_public_token()
RETURNS TEXT AS $$
DECLARE
  base64_token TEXT;
BEGIN
  -- Generate a random token using base64 encoding
  base64_token := encode(gen_random_bytes(24), 'base64');
  -- Convert base64 to base64url format (replace + with -, / with _, and remove padding)
  base64_token := replace(replace(rtrim(base64_token, '='), '+', '-'), '/', '_');
  RETURN base64_token;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically generate public_token for new jobs
CREATE OR REPLACE FUNCTION set_job_public_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set token if it's not already set
  IF NEW.public_token IS NULL THEN
    NEW.public_token := generate_public_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate public_token on insert
DROP TRIGGER IF EXISTS trigger_set_job_public_token ON jobs;
CREATE TRIGGER trigger_set_job_public_token
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_job_public_token();

-- Generate tokens for existing jobs that don't have one
UPDATE jobs
SET public_token = generate_public_token()
WHERE public_token IS NULL;

