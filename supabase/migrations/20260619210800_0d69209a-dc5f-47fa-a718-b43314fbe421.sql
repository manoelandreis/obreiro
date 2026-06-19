-- Tighten waitlist_leads INSERT to force defaults for status/tags/notes
DROP POLICY IF EXISTS "Anyone can insert waitlist" ON public.waitlist_leads;
CREATE POLICY "Anyone can insert waitlist" ON public.waitlist_leads
FOR INSERT WITH CHECK (
  email IS NOT NULL
  AND char_length(email) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (name IS NULL OR char_length(name) <= 120)
  AND (source IS NULL OR char_length(source) <= 60)
  AND status = 'novo'
  AND (tags IS NULL OR tags = '{}')
  AND notes IS NULL
);

-- Restrict quote_events INSERT to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert quote events" ON public.quote_events;
CREATE POLICY "Authenticated can insert quote events" ON public.quote_events
FOR INSERT TO authenticated WITH CHECK (
  event_type IS NOT NULL
  AND char_length(event_type) <= 60
  AND session_id IS NOT NULL
  AND (step_number IS NULL OR (step_number >= 0 AND step_number <= 50))
  AND (metadata IS NULL OR pg_column_size(metadata) <= 4096)
);
REVOKE INSERT ON public.quote_events FROM anon;

-- Restrict quote_logs INSERT to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert quote logs" ON public.quote_logs;
CREATE POLICY "Authenticated can insert quote logs" ON public.quote_logs
FOR INSERT TO authenticated WITH CHECK (
  (company_name IS NULL OR char_length(company_name) <= 200)
  AND (client_name IS NULL OR char_length(client_name) <= 200)
  AND (items_count IS NULL OR (items_count >= 0 AND items_count <= 500))
  AND (services_summary IS NULL OR pg_column_size(services_summary) <= 8192)
);
REVOKE INSERT ON public.quote_logs FROM anon;