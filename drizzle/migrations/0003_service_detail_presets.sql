CREATE TABLE public.service_detail_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_detail_presets TO authenticated;
GRANT ALL ON public.service_detail_presets TO service_role;
ALTER TABLE public.service_detail_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own presets select" ON public.service_detail_presets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own presets insert" ON public.service_detail_presets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own presets update" ON public.service_detail_presets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own presets delete" ON public.service_detail_presets FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX service_detail_presets_user_idx ON public.service_detail_presets(user_id);