
-- 1. Add email format + length validation on waitlist_leads to prevent spam/poisoning
ALTER TABLE public.waitlist_leads
  ADD CONSTRAINT waitlist_leads_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND length(email) <= 255);

ALTER TABLE public.waitlist_leads
  ADD CONSTRAINT waitlist_leads_name_length
  CHECK (name IS NULL OR length(name) <= 200);

ALTER TABLE public.waitlist_leads
  ADD CONSTRAINT waitlist_leads_source_length
  CHECK (source IS NULL OR length(source) <= 100);

-- 2. Add validation on quote_logs to prevent arbitrary data injection
ALTER TABLE public.quote_logs
  ADD CONSTRAINT quote_logs_company_length
  CHECK (company_name IS NULL OR length(company_name) <= 200);

ALTER TABLE public.quote_logs
  ADD CONSTRAINT quote_logs_client_length
  CHECK (client_name IS NULL OR length(client_name) <= 200);

ALTER TABLE public.quote_logs
  ADD CONSTRAINT quote_logs_total_range
  CHECK (total_amount IS NULL OR (total_amount >= 0 AND total_amount <= 100000000));

ALTER TABLE public.quote_logs
  ADD CONSTRAINT quote_logs_items_range
  CHECK (items_count IS NULL OR (items_count >= 0 AND items_count <= 1000));

-- 3. Lock down user_roles: explicit deny policies for INSERT/UPDATE/DELETE so privilege
--    escalation is impossible from the client. Only service_role / migrations can write.
CREATE POLICY "No client inserts to user_roles"
  ON public.user_roles FOR INSERT TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "No client updates to user_roles"
  ON public.user_roles FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "No client deletes from user_roles"
  ON public.user_roles FOR DELETE TO authenticated, anon
  USING (false);

-- 4. Restrict EXECUTE on has_role: it's only needed inside RLS policy evaluation,
--    which runs as the policy owner — not as the calling role. Revoke from public/anon/authenticated.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
