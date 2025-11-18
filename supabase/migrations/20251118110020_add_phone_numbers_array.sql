-- Add additional phone numbers array to jobs table
-- The existing contact_number field will be the primary phone number
-- This field will store any additional phone numbers

ALTER TABLE jobs
ADD COLUMN phone_numbers TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN jobs.phone_numbers IS 'Additional phone numbers (array) - primary phone is stored in contact_number field';

