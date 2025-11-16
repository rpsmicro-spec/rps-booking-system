-- Add contact_person_name, contact_person_designation, and notes fields to jobs table
-- contact_person_name: Name of the contact person at the company
-- contact_person_designation: Designation/role of the contact person
-- notes: Internal notes (not visible in public job view)

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_designation TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for contact_person_name for searchability
CREATE INDEX IF NOT EXISTS idx_jobs_contact_person_name 
ON jobs(contact_person_name) 
WHERE contact_person_name IS NOT NULL;

