-- Update job number generation to use financial year format (April 1 - March 31)
-- Format: {PREFIX}-{number}/{year1-year2}
-- Example: RPS-1/25-26 (April 2025 - March 2026)
-- Example: RPS-1/26-27 (April 2026 - March 2027)

-- Helper function to get financial year
CREATE OR REPLACE FUNCTION get_financial_year(input_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
  v_start_year INTEGER;
  v_end_year INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM input_date)::INTEGER;
  v_month := EXTRACT(MONTH FROM input_date)::INTEGER;
  
  -- Financial year starts April 1, ends March 31
  -- If month is April (4) or later, it's the current year's financial year
  -- If month is Jan-Mar (1-3), it's the previous year's financial year
  IF v_month >= 4 THEN
    v_start_year := v_year;
    v_end_year := v_year + 1;
  ELSE
    v_start_year := v_year - 1;
    v_end_year := v_year;
  END IF;
  
  -- Return format: 25-26 (last 2 digits of each year)
  RETURN LPAD((v_start_year % 100)::TEXT, 2, '0') || '-' || LPAD((v_end_year % 100)::TEXT, 2, '0');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to check if we're in a new financial year
CREATE OR REPLACE FUNCTION get_financial_year_start_year(input_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM input_date)::INTEGER;
  v_month := EXTRACT(MONTH FROM input_date)::INTEGER;
  
  -- Financial year starts April 1
  IF v_month >= 4 THEN
    RETURN v_year;
  ELSE
    RETURN v_year - 1;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the job number generation function to use financial year format
CREATE OR REPLACE FUNCTION generate_next_job_number()
RETURNS TEXT AS $$
DECLARE
  v_settings RECORD;
  v_job_number TEXT;
  v_current_fy_start_year INTEGER;
  v_financial_year TEXT;
  v_number_part TEXT;
  v_prefix TEXT;
BEGIN
  -- Lock and get the settings row (FOR UPDATE ensures exclusive lock)
  SELECT * INTO v_settings
  FROM job_number_settings
  LIMIT 1
  FOR UPDATE;
  
  -- If no settings exist, create default with RPS prefix
  IF NOT FOUND THEN
    INSERT INTO job_number_settings (prefix, number_base, next_number, year)
    VALUES ('RPS', 'sequence', 1, get_financial_year_start_year())
    RETURNING * INTO v_settings;
  END IF;
  
  -- Get current financial year start year (e.g., 2025 for April 2025 - March 2026)
  v_current_fy_start_year := get_financial_year_start_year();
  
  -- Get financial year string (e.g., '25-26')
  v_financial_year := get_financial_year();
  
  -- If financial year changed (new April 1st), reset counter to 1
  IF v_settings.year IS NULL OR v_settings.year != v_current_fy_start_year THEN
    v_settings.next_number := 1;
    v_settings.year := v_current_fy_start_year;
  END IF;
  
  -- Build number part: just the sequential number (no padding needed, but we can keep it simple)
  v_number_part := v_settings.next_number::TEXT;
  
  -- Get prefix (default to RPS if empty)
  v_prefix := COALESCE(NULLIF(TRIM(v_settings.prefix), ''), 'RPS');
  
  -- Build final job number: {PREFIX}-{number}/{year1-year2}
  -- Example: RPS-1/25-26
  v_job_number := v_prefix || '-' || v_number_part || '/' || v_financial_year;
  
  -- Increment the next_number atomically and update year if needed
  UPDATE job_number_settings
  SET 
    next_number = v_settings.next_number + 1,
    year = v_current_fy_start_year,
    updated_at = NOW()
  WHERE id = v_settings.id;
  
  RETURN v_job_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update default settings to use RPS prefix
UPDATE job_number_settings
SET prefix = 'RPS'
WHERE prefix = 'JOB' OR prefix = '' OR prefix IS NULL;

-- If no settings exist, ensure default uses RPS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM job_number_settings) THEN
    INSERT INTO job_number_settings (prefix, number_base, next_number, year)
    VALUES ('RPS', 'sequence', 1, get_financial_year_start_year());
  END IF;
END $$;

