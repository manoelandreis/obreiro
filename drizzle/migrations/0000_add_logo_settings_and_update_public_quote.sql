ALTER TABLE public.app_user_settings
  ADD COLUMN IF NOT EXISTS logo_kind text NOT NULL DEFAULT 'icon',
  ADD COLUMN IF NOT EXISTS logo_height integer NOT NULL DEFAULT 44,
  ADD COLUMN IF NOT EXISTS logo_bg text NOT NULL DEFAULT 'transparent';

CREATE OR REPLACE FUNCTION public.get_public_quote(_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  q public.app_quotes%ROWTYPE;
  effective_terms jsonb;
  s record;
  merged_company jsonb;
BEGIN
  SELECT * INTO q FROM public.app_quotes WHERE public_token = _token LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  effective_terms := q.payment_terms;

  SELECT default_payment_terms, logo_url, logo_kind, logo_height, logo_bg,
         payment_iban, payment_mbway,
         company_name, company_nif, company_email, company_phone, company_address,
         brand_color_primary, brand_color_accent
    INTO s
    FROM public.app_user_settings
    WHERE user_id = q.user_id
    LIMIT 1;

  IF effective_terms IS NULL THEN
    effective_terms := s.default_payment_terms;
  END IF;

  merged_company := COALESCE(q.company_snapshot, '{}'::jsonb)
    || jsonb_strip_nulls(jsonb_build_object(
      'logo_path', s.logo_url,
      'logo_kind', COALESCE(NULLIF(q.company_snapshot->>'logo_kind',''), s.logo_kind),
      'logo_height', COALESCE(NULLIF(q.company_snapshot->>'logo_height','')::int, s.logo_height),
      'logo_bg', COALESCE(NULLIF(q.company_snapshot->>'logo_bg',''), s.logo_bg),
      'iban', COALESCE(NULLIF(q.company_snapshot->>'iban',''), s.payment_iban),
      'mbway', COALESCE(NULLIF(q.company_snapshot->>'mbway',''), s.payment_mbway),
      'name', COALESCE(NULLIF(q.company_snapshot->>'name',''), s.company_name),
      'nif', COALESCE(NULLIF(q.company_snapshot->>'nif',''), s.company_nif),
      'email', COALESCE(NULLIF(q.company_snapshot->>'email',''), s.company_email),
      'phone', COALESCE(NULLIF(q.company_snapshot->>'phone',''), s.company_phone),
      'address', COALESCE(NULLIF(q.company_snapshot->>'address',''), s.company_address)
    ));

  RETURN jsonb_build_object(
    'id', q.id,
    'title', q.title,
    'status', q.status,
    'company_snapshot', merged_company,
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