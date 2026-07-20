-- Group jobs into unique customers server-side, with search and pagination.
-- Replaces the JS grouping in /api/customers, which fetched all jobs rows and
-- was silently capped at 1000 rows by PostgREST (customers past the cap
-- vanished from the directory).
--
-- SECURITY INVOKER (the default): RLS on jobs applies to the calling user.
CREATE OR REPLACE FUNCTION public.get_customers_grouped(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH grouped AS (
    -- One row per unique customer (name + email + contact number,
    -- case-insensitive), represented by that customer's most recent job.
    SELECT DISTINCT ON (lower(j.customer_name), lower(coalesce(j.email, '')), coalesce(j.contact_number, ''))
      j.customer_name,
      j.email,
      j.contact_number,
      j.address_street,
      j.address_area,
      j.address_city,
      j.address_state,
      j.address_pincode,
      j.contact_person_name,
      j.contact_person_designation,
      count(*) OVER w AS job_count,
      max(j.created_at) OVER w AS last_job_date,
      min(j.created_at) OVER w AS created_at
    FROM jobs j
    WHERE j.deleted_at IS NULL
      AND (
        p_search IS NULL OR p_search = ''
        OR j.customer_name ILIKE '%' || p_search || '%'
        OR j.email ILIKE '%' || p_search || '%'
        OR j.contact_number ILIKE '%' || p_search || '%'
      )
    WINDOW w AS (PARTITION BY lower(j.customer_name), lower(coalesce(j.email, '')), coalesce(j.contact_number, ''))
    ORDER BY lower(j.customer_name), lower(coalesce(j.email, '')), coalesce(j.contact_number, ''), j.created_at DESC NULLS LAST
  ),
  page AS (
    SELECT g.*
    FROM grouped g
    ORDER BY lower(g.customer_name), g.customer_name
    LIMIT greatest(coalesce(p_limit, 50), 1)
    OFFSET greatest(coalesce(p_offset, 0), 0)
  )
  SELECT jsonb_build_object(
    'customers', coalesce(
      (SELECT jsonb_agg(to_jsonb(p) ORDER BY lower(p.customer_name), p.customer_name) FROM page p),
      '[]'::jsonb
    ),
    'total', (SELECT count(*) FROM grouped)
  )
$$;

REVOKE EXECUTE ON FUNCTION public.get_customers_grouped(text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_customers_grouped(text, integer, integer) TO authenticated, service_role;
