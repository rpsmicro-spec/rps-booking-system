-- Security hardening:
-- 1) The public-access policies granted anon SELECT on every job (the token
--    condition only checked that a token EXISTS, not that it matched), letting
--    anyone with the anon key dump the whole jobs table. The public tracking
--    page now reads through the service-role client server-side, so anon needs
--    no direct table access at all.
DROP POLICY IF EXISTS "Public can view jobs by public_token" ON jobs;
DROP POLICY IF EXISTS "Public can view job status history for public jobs" ON job_status_history;

-- 2) handle_new_user trusted raw_user_meta_data->>'role', which self-signup
--    callers control — an attacker could sign up as 'owner' with the anon key.
--    Always create users as 'staff'; the invite API sets the real role
--    afterwards via the service-role client.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'staff'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = NEW.email,
    name = COALESCE(NEW.raw_user_meta_data->>'name', users.name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) "System can manage cleanup log" was USING(true)/WITH CHECK(true) for all
--    roles; the cron writes through the service-role client, which bypasses
--    RLS anyway, so the policy only granted anon read/write for no reason.
DROP POLICY IF EXISTS "System can manage cleanup log" ON cleanup_log;

-- 4) Idempotency key for offline sync: retrying a sync whose response was lost
--    must not create a second job. The client sends its IndexedDB job id as
--    client_ref; the unique index makes replays detectable.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_ref TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS jobs_client_ref_key
  ON jobs (client_ref) WHERE client_ref IS NOT NULL;
