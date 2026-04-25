
CREATE TABLE public.app_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.app_clients(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.app_jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Orçamento',
  company_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  iva NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own quotes select" ON public.app_quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own quotes insert" ON public.app_quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own quotes update" ON public.app_quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own quotes delete" ON public.app_quotes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_app_quotes_updated_at
BEFORE UPDATE ON public.app_quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_app_quotes_user ON public.app_quotes(user_id, created_at DESC);
CREATE INDEX idx_app_quotes_client ON public.app_quotes(client_id);
