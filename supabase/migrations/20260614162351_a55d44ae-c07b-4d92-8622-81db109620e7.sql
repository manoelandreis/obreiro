
CREATE OR REPLACE FUNCTION public.respond_to_quote(_token uuid, _action text, _message text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  q public.app_quotes%ROWTYPE;
  new_status public.quote_status;
  trimmed_msg text;
BEGIN
  IF _action NOT IN ('accept', 'reject') THEN
    RAISE EXCEPTION 'invalid action';
  END IF;

  trimmed_msg := NULLIF(TRIM(_message), '');
  IF trimmed_msg IS NOT NULL AND char_length(trimmed_msg) > 2000 THEN
    RAISE EXCEPTION 'message too long';
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
        client_message = COALESCE(trimmed_msg, q.client_message)
    WHERE id = q.id;
  INSERT INTO public.quote_status_history (quote_id, user_id, status, source, note)
    VALUES (q.id, q.user_id, new_status, 'client', trimmed_msg);
  RETURN jsonb_build_object('ok', true, 'status', new_status);
END;
$function$;

ALTER TABLE public.app_quotes
  DROP CONSTRAINT IF EXISTS client_message_len;
ALTER TABLE public.app_quotes
  ADD CONSTRAINT client_message_len CHECK (client_message IS NULL OR char_length(client_message) <= 2000);

ALTER TABLE public.quote_status_history
  DROP CONSTRAINT IF EXISTS note_len;
ALTER TABLE public.quote_status_history
  ADD CONSTRAINT note_len CHECK (note IS NULL OR char_length(note) <= 2000);
