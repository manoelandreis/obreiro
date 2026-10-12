CREATE TABLE public.quote_usage_monthly (
  user_id uuid NOT NULL,
  month_ref date NOT NULL,
  quotes_created integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month_ref)
);
GRANT SELECT ON public.quote_usage_monthly TO authenticated;
GRANT ALL ON public.quote_usage_monthly TO service_role;
ALTER TABLE public.quote_usage_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON public.quote_usage_monthly FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.track_quote_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  m date := date_trunc('month', now() AT TIME ZONE 'UTC')::date;
  t subscription_tier; st subscription_status; used integer;
BEGIN
  SELECT tier, status INTO t, st FROM public.user_subscriptions WHERE user_id = NEW.user_id;
  IF COALESCE(t,'free') = 'free' OR COALESCE(st,'active') NOT IN ('active','trialing') THEN
    SELECT quotes_created INTO used FROM public.quote_usage_monthly WHERE user_id = NEW.user_id AND month_ref = m;
    IF COALESCE(used,0) >= 5 THEN
      RAISE EXCEPTION 'quota_exceeded';
    END IF;
  END IF;
  INSERT INTO public.quote_usage_monthly (user_id, month_ref, quotes_created)
  VALUES (NEW.user_id, m, 1)
  ON CONFLICT (user_id, month_ref) DO UPDATE SET quotes_created = quote_usage_monthly.quotes_created + 1;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_track_quote_created BEFORE INSERT ON public.app_quotes
FOR EACH ROW EXECUTE FUNCTION public.track_quote_created();