CREATE OR REPLACE FUNCTION public.get_public_quote(_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  q public.app_quotes%ROWTYPE;
  effective_terms jsonb;
BEGIN
  SELECT * INTO q FROM public.app_quotes WHERE public_token = _token LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  effective_terms := q.payment_terms;
  IF effective_terms IS NULL THEN
    SELECT default_payment_terms INTO effective_terms
      FROM public.app_user_settings
      WHERE user_id = q.user_id
      LIMIT 1;
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
    'created_at', q.created_at,
    'payment_terms', effective_terms
  );
END;
$function$;