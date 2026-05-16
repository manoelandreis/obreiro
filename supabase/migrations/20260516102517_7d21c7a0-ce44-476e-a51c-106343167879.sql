
-- ============ Quote status + tokens ============
CREATE TYPE public.quote_status AS ENUM ('rascunho', 'enviado', 'visto', 'aceite', 'rejeitado', 'expirado');

ALTER TABLE public.app_quotes
  ADD COLUMN status public.quote_status NOT NULL DEFAULT 'rascunho',
  ADD COLUMN public_token uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN sent_at timestamptz,
  ADD COLUMN viewed_at timestamptz,
  ADD COLUMN responded_at timestamptz,
  ADD COLUMN expires_at date,
  ADD COLUMN client_message text;

CREATE INDEX idx_app_quotes_public_token ON public.app_quotes(public_token);
CREATE INDEX idx_app_quotes_user_status ON public.app_quotes(user_id, status);

-- Public read by token (no auth) — only safe fields are exposed via the SECURITY DEFINER fn below
CREATE POLICY "public quote read by token" ON public.app_quotes
  FOR SELECT TO anon USING (false); -- We use a SECURITY DEFINER function instead.

-- ============ Quote status history ============
CREATE TABLE public.quote_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.app_quotes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status public.quote_status NOT NULL,
  source text NOT NULL DEFAULT 'owner',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own status history select" ON public.quote_status_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own status history insert" ON public.quote_status_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_status_history_quote ON public.quote_status_history(quote_id, created_at DESC);

-- ============ Quote attachments ============
CREATE TYPE public.attachment_type AS ENUM ('photo', 'file');

CREATE TABLE public.quote_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.app_quotes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type public.attachment_type NOT NULL DEFAULT 'photo',
  storage_path text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own attachments select" ON public.quote_attachments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own attachments insert" ON public.quote_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own attachments update" ON public.quote_attachments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own attachments delete" ON public.quote_attachments
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_attachments_quote ON public.quote_attachments(quote_id, sort_order);

-- ============ Public quote view function ============
-- Returns minimal safe data + URLs for attachments; bumps viewed_at + writes history once.
CREATE OR REPLACE FUNCTION public.get_public_quote(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  q public.app_quotes%ROWTYPE;
BEGIN
  SELECT * INTO q FROM public.app_quotes WHERE public_token = _token LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object(
    'id', q.id,
    'title', q.title,
    'status', q.status,
    'company_snapshot', q.company_snapshot,
    'client_snapshot', q.client_snapshot,
    'services', q.services,
    'subtotal', q.subtotal,
    'iva', q.iva,
    'total', q.total,
    'notes', q.notes,
    'sent_at', q.sent_at,
    'viewed_at', q.viewed_at,
    'responded_at', q.responded_at,
    'expires_at', q.expires_at,
    'created_at', q.created_at
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_public_quote(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_quote(uuid) TO anon, authenticated;

-- Marks quote as viewed (first time only) and records history.
CREATE OR REPLACE FUNCTION public.mark_quote_viewed(_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.app_quotes%ROWTYPE;
BEGIN
  SELECT * INTO q FROM public.app_quotes WHERE public_token = _token LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;
  IF q.viewed_at IS NULL THEN
    UPDATE public.app_quotes
      SET viewed_at = now(),
          status = CASE WHEN status IN ('rascunho','enviado') THEN 'visto'::quote_status ELSE status END
      WHERE id = q.id;
    INSERT INTO public.quote_status_history (quote_id, user_id, status, source)
      VALUES (q.id, q.user_id, 'visto', 'client');
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mark_quote_viewed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_quote_viewed(uuid) TO anon, authenticated;

-- Client accept/reject — atomic update.
CREATE OR REPLACE FUNCTION public.respond_to_quote(_token uuid, _action text, _message text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.app_quotes%ROWTYPE;
  new_status public.quote_status;
BEGIN
  IF _action NOT IN ('accept', 'reject') THEN
    RAISE EXCEPTION 'invalid action';
  END IF;
  SELECT * INTO q FROM public.app_quotes WHERE public_token = _token LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF q.status IN ('aceite','rejeitado','expirado') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_responded', 'status', q.status);
  END IF;
  new_status := CASE WHEN _action = 'accept' THEN 'aceite'::quote_status ELSE 'rejeitado'::quote_status END;
  UPDATE public.app_quotes
    SET status = new_status,
        responded_at = now(),
        client_message = COALESCE(NULLIF(TRIM(_message), ''), q.client_message)
    WHERE id = q.id;
  INSERT INTO public.quote_status_history (quote_id, user_id, status, source, note)
    VALUES (q.id, q.user_id, new_status, 'client', NULLIF(TRIM(_message), ''));
  RETURN jsonb_build_object('ok', true, 'status', new_status);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.respond_to_quote(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_quote(uuid, text, text) TO anon, authenticated;

-- Backfill: existing quotes get public_token + 'rascunho'
UPDATE public.app_quotes
  SET public_token = gen_random_uuid()
  WHERE public_token IS NULL;
