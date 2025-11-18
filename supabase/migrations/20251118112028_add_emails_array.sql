-- Add additional emails array to jobs table
-- The existing email field will be the primary email
-- This field will store any additional emails

ALTER TABLE jobs
ADD COLUMN emails TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN jobs.emails IS 'Additional email addresses (array) - primary email is stored in email field';

