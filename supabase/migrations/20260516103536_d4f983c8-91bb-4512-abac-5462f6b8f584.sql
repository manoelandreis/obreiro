
-- =====================================================
-- Sprint A: admin RPC para listar utilizadores com agregados
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  tier subscription_tier,
  sub_status subscription_status,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  quotes_count bigint,
  quotes_accepted bigint,
  last_quote_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    COALESCE(s.tier, 'free'::subscription_tier) as tier,
    COALESCE(s.status, 'active'::subscription_status) as sub_status,
    s.current_period_end,
    COALESCE(s.cancel_at_period_end, false) as cancel_at_period_end,
    COALESCE(qc.cnt, 0) as quotes_count,
    COALESCE(qa.cnt, 0) as quotes_accepted,
    qc.last_at as last_quote_at
  FROM public.profiles p
  LEFT JOIN public.user_subscriptions s ON s.user_id = p.user_id
  LEFT JOIN (
    SELECT user_id, count(*) as cnt, max(created_at) as last_at
    FROM public.app_quotes GROUP BY user_id
  ) qc ON qc.user_id = p.user_id
  LEFT JOIN (
    SELECT user_id, count(*) as cnt
    FROM public.app_quotes WHERE status = 'aceite' GROUP BY user_id
  ) qa ON qa.user_id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- Admin RPC: alterar tier / status de uma subscrição manualmente
CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  _user_id uuid,
  _tier subscription_tier,
  _status subscription_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO public.user_subscriptions (user_id, tier, status)
  VALUES (_user_id, _tier, _status)
  ON CONFLICT (user_id) DO UPDATE
    SET tier = EXCLUDED.tier,
        status = EXCLUDED.status,
        updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_subscription(uuid, subscription_tier, subscription_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_subscription(uuid, subscription_tier, subscription_status) TO authenticated;

-- =====================================================
-- Sprint B: KPIs agregados para dashboard
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_dashboard_kpis()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'users_total', (SELECT count(*) FROM public.profiles),
    'users_new_30d', (SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '30 days'),
    'users_new_7d', (SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '7 days'),
    'subs_free', (SELECT count(*) FROM public.user_subscriptions WHERE tier = 'free'),
    'subs_pro', (SELECT count(*) FROM public.user_subscriptions WHERE tier = 'pro' AND status = 'active'),
    'subs_business', (SELECT count(*) FROM public.user_subscriptions WHERE tier = 'business' AND status = 'active'),
    'subs_canceled', (SELECT count(*) FROM public.user_subscriptions WHERE status IN ('canceled','past_due')),
    'mrr_estimate', (
      SELECT COALESCE(SUM(CASE
        WHEN tier = 'pro' THEN 12
        WHEN tier = 'business' THEN 29
        ELSE 0 END), 0)
      FROM public.user_subscriptions WHERE status = 'active'
    ),
    'quotes_total', (SELECT count(*) FROM public.app_quotes),
    'quotes_sent', (SELECT count(*) FROM public.app_quotes WHERE status IN ('enviado','visto','aceite','rejeitado')),
    'quotes_accepted', (SELECT count(*) FROM public.app_quotes WHERE status = 'aceite'),
    'quotes_30d', (SELECT count(*) FROM public.app_quotes WHERE created_at >= now() - interval '30 days'),
    'leads_total', (SELECT count(*) FROM public.waitlist_leads),
    'leads_30d', (SELECT count(*) FROM public.waitlist_leads WHERE created_at >= now() - interval '30 days')
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_dashboard_kpis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_kpis() TO authenticated;

-- Time series para gráfico (signups e quotes nos últimos 30d)
CREATE OR REPLACE FUNCTION public.admin_dashboard_timeseries(_days integer DEFAULT 30)
RETURNS TABLE (
  day date,
  signups bigint,
  quotes bigint,
  leads bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH days AS (
    SELECT generate_series(
      (current_date - (_days - 1))::date,
      current_date,
      '1 day'::interval
    )::date AS day
  )
  SELECT
    d.day,
    COALESCE((SELECT count(*) FROM public.profiles WHERE created_at::date = d.day), 0) as signups,
    COALESCE((SELECT count(*) FROM public.app_quotes WHERE created_at::date = d.day), 0) as quotes,
    COALESCE((SELECT count(*) FROM public.waitlist_leads WHERE created_at::date = d.day), 0) as leads
  FROM days d
  ORDER BY d.day ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_dashboard_timeseries(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_timeseries(integer) TO authenticated;

-- =====================================================
-- Sprint C: enriquecer waitlist_leads com CRM-lite
-- =====================================================
DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM ('novo','contactado','qualificado','convertido','perdido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.waitlist_leads
  ADD COLUMN IF NOT EXISTS status public.lead_status NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Admins podem editar leads
DROP POLICY IF EXISTS "Admins can update leads" ON public.waitlist_leads;
CREATE POLICY "Admins can update leads"
ON public.waitlist_leads
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete leads" ON public.waitlist_leads;
CREATE POLICY "Admins can delete leads"
ON public.waitlist_leads
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_waitlist_leads_updated_at ON public.waitlist_leads;
CREATE TRIGGER trg_waitlist_leads_updated_at
BEFORE UPDATE ON public.waitlist_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
