-- Fix generate_public_token function to use base64 encoding and convert to base64url
-- PostgreSQL's encode() function doesn't support 'base64url' directly
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

