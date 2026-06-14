
CREATE TABLE IF NOT EXISTS public.public_email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  email text NOT NULL,
  template text NOT NULL,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS public_email_send_log_ip_created_idx
  ON public.public_email_send_log (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS public_email_send_log_idem_idx
  ON public.public_email_send_log (idempotency_key);

GRANT ALL ON public.public_email_send_log TO service_role;

ALTER TABLE public.public_email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only - no anon/auth access"
  ON public.public_email_send_log FOR SELECT
  USING (false);
