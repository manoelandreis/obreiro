-- Restore anonymous INSERT on quote_events (landing page analytics)
DROP POLICY IF EXISTS "Authenticated can insert quote events" ON public.quote_events;
GRANT INSERT ON public.quote_events TO anon;
CREATE POLICY "Anyone can insert quote events" ON public.quote_events
FOR INSERT WITH CHECK (
  event_type IS NOT NULL
  AND char_length(event_type) <= 60
  AND session_id IS NOT NULL
  AND (step_number IS NULL OR (step_number >= 0 AND step_number <= 50))
  AND (metadata IS NULL OR pg_column_size(metadata) <= 4096)
);

-- Restore anonymous INSERT on quote_logs (landing page quote generator)
DROP POLICY IF EXISTS "Authenticated can insert quote logs" ON public.quote_logs;
GRANT INSERT ON public.quote_logs TO anon;
CREATE POLICY "Anyone can insert quote logs" ON public.quote_logs
FOR INSERT WITH CHECK (
  (company_name IS NULL OR char_length(company_name) <= 200)
  AND (client_name IS NULL OR char_length(client_name) <= 200)
  AND (items_count IS NULL OR (items_count >= 0 AND items_count <= 500))
  AND (services_summary IS NULL OR pg_column_size(services_summary) <= 8192)
);