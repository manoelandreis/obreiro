DROP POLICY IF EXISTS "Anyone can read active templates" ON public.quote_templates;
CREATE POLICY "Anyone can read active templates" ON public.quote_templates FOR SELECT USING (is_active = true);