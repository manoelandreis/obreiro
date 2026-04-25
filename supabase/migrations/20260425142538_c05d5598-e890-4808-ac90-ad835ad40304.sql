-- Status enum for jobs
CREATE TYPE public.job_status AS ENUM ('orcamento', 'aprovado', 'em_curso', 'concluido');

-- Clients
CREATE TABLE public.app_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  rgpd_consent BOOLEAN NOT NULL DEFAULT false,
  rgpd_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_clients_user ON public.app_clients(user_id);

-- Jobs
CREATE TABLE public.app_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.app_clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.job_status NOT NULL DEFAULT 'orcamento',
  start_date DATE,
  estimated_value NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_jobs_user ON public.app_jobs(user_id);
CREATE INDEX idx_app_jobs_client ON public.app_jobs(client_id);

-- Task groups (e.g. "Preparação e Pintura")
CREATE TABLE public.app_job_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.app_jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_job_groups_job ON public.app_job_groups(job_id);

-- Tasks/steps within a group
CREATE TABLE public.app_job_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.app_job_groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_job_tasks_group ON public.app_job_tasks(group_id);

-- Materials within a group
CREATE TABLE public.app_job_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.app_job_groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  obtained BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_job_materials_group ON public.app_job_materials(group_id);

-- Per-user settings
CREATE TABLE public.app_user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  pin_enabled BOOLEAN NOT NULL DEFAULT false,
  pin_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_job_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_job_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_job_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_user_settings ENABLE ROW LEVEL SECURITY;

-- Owner-only policies (one per table, per command)
CREATE POLICY "own clients select" ON public.app_clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own clients insert" ON public.app_clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own clients update" ON public.app_clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own clients delete" ON public.app_clients FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own jobs select" ON public.app_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own jobs insert" ON public.app_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own jobs update" ON public.app_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own jobs delete" ON public.app_jobs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own groups select" ON public.app_job_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own groups insert" ON public.app_job_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own groups update" ON public.app_job_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own groups delete" ON public.app_job_groups FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own tasks select" ON public.app_job_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own tasks insert" ON public.app_job_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tasks update" ON public.app_job_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own tasks delete" ON public.app_job_tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own materials select" ON public.app_job_materials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own materials insert" ON public.app_job_materials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own materials update" ON public.app_job_materials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own materials delete" ON public.app_job_materials FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own settings select" ON public.app_user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own settings insert" ON public.app_user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own settings update" ON public.app_user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own settings delete" ON public.app_user_settings FOR DELETE USING (auth.uid() = user_id);

-- updated_at triggers
CREATE TRIGGER trg_app_clients_updated BEFORE UPDATE ON public.app_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_app_jobs_updated BEFORE UPDATE ON public.app_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_app_user_settings_updated BEFORE UPDATE ON public.app_user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();