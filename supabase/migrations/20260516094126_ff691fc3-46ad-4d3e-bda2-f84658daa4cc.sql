
-- 1) Revoke direct column access to PIN credentials
REVOKE SELECT (pin_hash, pin_salt) ON public.app_user_settings FROM anon, authenticated;
REVOKE UPDATE (pin_hash, pin_salt) ON public.app_user_settings FROM anon, authenticated;
REVOKE INSERT (pin_hash, pin_salt) ON public.app_user_settings FROM anon, authenticated;

-- 2) Tighten public-insert tables with size/shape validation to limit spam
-- waitlist_leads
DROP POLICY IF EXISTS "Anyone can insert waitlist" ON public.waitlist_leads;
CREATE POLICY "Anyone can insert waitlist"
ON public.waitlist_leads
FOR INSERT
WITH CHECK (
  email IS NOT NULL
  AND char_length(email) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (name IS NULL OR char_length(name) <= 120)
  AND (source IS NULL OR char_length(source) <= 60)
);

-- quote_events
DROP POLICY IF EXISTS "Anyone can insert quote events" ON public.quote_events;
CREATE POLICY "Anyone can insert quote events"
ON public.quote_events
FOR INSERT
WITH CHECK (
  event_type IS NOT NULL
  AND char_length(event_type) <= 60
  AND session_id IS NOT NULL
  AND (step_number IS NULL OR (step_number BETWEEN 0 AND 50))
  AND (metadata IS NULL OR pg_column_size(metadata) <= 4096)
);

-- quote_logs
DROP POLICY IF EXISTS "Anyone can insert quote logs" ON public.quote_logs;
CREATE POLICY "Anyone can insert quote logs"
ON public.quote_logs
FOR INSERT
WITH CHECK (
  (company_name IS NULL OR char_length(company_name) <= 200)
  AND (client_name IS NULL OR char_length(client_name) <= 200)
  AND (items_count IS NULL OR (items_count BETWEEN 0 AND 500))
  AND (services_summary IS NULL OR pg_column_size(services_summary) <= 8192)
);

-- 3) Restrict execute on SECURITY DEFINER / internal functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
-- has_role stays callable by authenticated (RLS policies need it); revoke from anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
