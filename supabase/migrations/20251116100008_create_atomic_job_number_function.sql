-- Create a function that atomically generates and increments the job number
-- This uses SELECT FOR UPDATE to prevent race conditions and ensure unique job numbers
CREATE OR REPLACE FUNCTION generate_next_job_number()
RETURNS TEXT AS $$
DECLARE
  v_settings RECORD;
  v_job_number TEXT;
  v_current_year INTEGER;
  v_number_part TEXT;
BEGIN
  -- Lock and get the settings row (FOR UPDATE ensures exclusive lock)
  SELECT * INTO v_settings
  FROM job_number_settings
  LIMIT 1
  FOR UPDATE;
  
  -- If no settings exist, create default
  IF NOT FOUND THEN
    INSERT INTO job_number_settings (prefix, number_base, next_number, year)
    VALUES ('JOB', 'sequence', 1, EXTRACT(YEAR FROM NOW())::INTEGER)
    RETURNING * INTO v_settings;
  END IF;
  
  v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  
  -- Generate the job number from current settings
  IF v_settings.number_base = 'year' THEN
    -- If year changed, reset to 1
    IF v_settings.year IS NULL OR v_settings.year != v_current_year THEN
      v_settings.next_number := 1;
      v_settings.year := v_current_year;
    END IF;
    v_number_part := v_current_year::TEXT || '-' || LPAD(v_settings.next_number::TEXT, 3, '0');
  ELSE
    -- Sequence-based
    v_number_part := LPAD(v_settings.next_number::TEXT, 3, '0');
  END IF;
  
  -- Combine prefix and number
  IF v_settings.prefix IS NOT NULL AND TRIM(v_settings.prefix) != '' THEN
    v_job_number := TRIM(v_settings.prefix) || '-' || v_number_part;
  ELSE
    v_job_number := v_number_part;
  END IF;
  
  -- Increment the next_number atomically
  UPDATE job_number_settings
  SET 
    next_number = v_settings.next_number + 1,
    year = CASE 
      WHEN number_base = 'year' AND (year IS NULL OR year != v_current_year) 
      THEN v_current_year 
      ELSE year 
    END,
    updated_at = NOW()
  WHERE id = v_settings.id;
  
  RETURN v_job_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_next_job_number() TO authenticated;

