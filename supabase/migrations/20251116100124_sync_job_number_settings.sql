-- Sync job_number_settings.next_number based on existing jobs
-- This ensures the next_number is correct even if it got out of sync

DO $$
DECLARE
  v_settings RECORD;
  v_max_number INTEGER := 0;
  v_job_number TEXT;
  v_number_part TEXT;
  v_prefix TEXT;
  v_number_base TEXT;
  v_current_year INTEGER;
BEGIN
  -- Get current settings
  SELECT * INTO v_settings FROM job_number_settings LIMIT 1;
  
  IF NOT FOUND THEN
    -- If no settings exist, create default
    INSERT INTO job_number_settings (prefix, number_base, next_number, year)
    VALUES ('JOB', 'sequence', 1, EXTRACT(YEAR FROM NOW())::INTEGER);
    RETURN;
  END IF;
  
  v_prefix := COALESCE(v_settings.prefix, 'JOB');
  v_number_base := COALESCE(v_settings.number_base, 'sequence');
  v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  
  -- Find the maximum job number from existing jobs
  IF v_number_base = 'year' THEN
    -- For year-based: extract number from format like "2024-001" or "PREFIX-2024-001"
    FOR v_job_number IN 
      SELECT job_number FROM jobs WHERE deleted_at IS NULL
    LOOP
      -- Remove prefix if present (e.g., "JOB-2024-001" -> "2024-001")
      IF v_prefix != '' AND v_job_number LIKE v_prefix || '-%' THEN
        v_number_part := SUBSTRING(v_job_number FROM LENGTH(v_prefix) + 2);
      ELSE
        v_number_part := v_job_number;
      END IF;
      
      -- Extract year and number (format: "YYYY-NNN")
      IF v_number_part ~ '^\d{4}-\d+$' THEN
        -- Check if it's for the current year
        IF SUBSTRING(v_number_part FROM 1 FOR 4)::INTEGER = v_current_year THEN
          v_number_part := SUBSTRING(v_number_part FROM 6);
          IF v_number_part::INTEGER > v_max_number THEN
            v_max_number := v_number_part::INTEGER;
          END IF;
        END IF;
      END IF;
    END LOOP;
  ELSE
    -- For sequence-based: extract number from format like "001" or "PREFIX-001"
    FOR v_job_number IN 
      SELECT job_number FROM jobs WHERE deleted_at IS NULL
    LOOP
      -- Remove prefix if present (e.g., "JOB-001" -> "001")
      IF v_prefix != '' AND v_job_number LIKE v_prefix || '-%' THEN
        v_number_part := SUBSTRING(v_job_number FROM LENGTH(v_prefix) + 2);
      ELSE
        v_number_part := v_job_number;
      END IF;
      
      -- Extract numeric part (remove leading zeros)
      IF v_number_part ~ '^\d+$' THEN
        IF v_number_part::INTEGER > v_max_number THEN
          v_max_number := v_number_part::INTEGER;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Update next_number to max + 1 (or keep current if it's already higher)
  UPDATE job_number_settings
  SET 
    next_number = GREATEST(COALESCE(v_max_number, 0) + 1, next_number),
    updated_at = NOW()
  WHERE id = v_settings.id;
  
END $$;

