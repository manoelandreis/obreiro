
CREATE OR REPLACE FUNCTION public.admin_list_users()
 RETURNS TABLE(user_id uuid, email text, display_name text, created_at timestamp with time zone, tier subscription_tier, sub_status subscription_status, current_period_end timestamp with time zone, cancel_at_period_end boolean, quotes_count bigint, quotes_accepted bigint, last_quote_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.email,
    p.display_name,
    p.created_at,
    COALESCE(s.tier, 'free'::subscription_tier) AS tier,
    COALESCE(s.status, 'active'::subscription_status) AS sub_status,
    s.current_period_end,
    COALESCE(s.cancel_at_period_end, false) AS cancel_at_period_end,
    COALESCE(qc.cnt, 0) AS quotes_count,
    COALESCE(qa.cnt, 0) AS quotes_accepted,
    qc.last_at AS last_quote_at
  FROM public.profiles p
  LEFT JOIN public.user_subscriptions s ON s.user_id = p.user_id
  LEFT JOIN (
    SELECT q.user_id AS uid, count(*) AS cnt, max(q.created_at) AS last_at
    FROM public.app_quotes q
    GROUP BY q.user_id
  ) qc ON qc.uid = p.user_id
  LEFT JOIN (
    SELECT q.user_id AS uid, count(*) AS cnt
    FROM public.app_quotes q
    WHERE q.status = 'aceite'
    GROUP BY q.user_id
  ) qa ON qa.uid = p.user_id
  ORDER BY p.created_at DESC;
END;
$function$;
