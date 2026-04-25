
ALTER TABLE public.app_user_settings
  ADD COLUMN IF NOT EXISTS company_nif TEXT,
  ADD COLUMN IF NOT EXISTS company_email TEXT,
  ADD COLUMN IF NOT EXISTS company_phone TEXT,
  ADD COLUMN IF NOT EXISTS company_address TEXT;
