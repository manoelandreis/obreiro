
-- ============ Subscription tiers ============
CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'business');
CREATE TYPE public.subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'incomplete');

CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own subscription select" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- No client writes; webhook (service role) bypasses RLS.
CREATE POLICY "no client insert subscription" ON public.user_subscriptions
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "no client update subscription" ON public.user_subscriptions
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "no client delete subscription" ON public.user_subscriptions
  FOR DELETE TO anon, authenticated USING (false);

CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create free subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_subscription() FROM anon, authenticated;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Backfill existing users
INSERT INTO public.user_subscriptions (user_id, tier, status)
SELECT id, 'free', 'active' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ============ Branding columns ============
ALTER TABLE public.app_user_settings
  ADD COLUMN logo_url text,
  ADD COLUMN brand_color_primary text,
  ADD COLUMN brand_color_accent text,
  ADD COLUMN company_description text,
  ADD COLUMN company_terms text,
  ADD COLUMN payment_conditions text,
  ADD COLUMN quote_validity_days integer NOT NULL DEFAULT 30;

-- Length safety
ALTER TABLE public.app_user_settings
  ADD CONSTRAINT company_description_len CHECK (company_description IS NULL OR char_length(company_description) <= 2000),
  ADD CONSTRAINT company_terms_len CHECK (company_terms IS NULL OR char_length(company_terms) <= 5000),
  ADD CONSTRAINT payment_conditions_len CHECK (payment_conditions IS NULL OR char_length(payment_conditions) <= 2000),
  ADD CONSTRAINT quote_validity_range CHECK (quote_validity_days BETWEEN 1 AND 365);

-- ============ Storage buckets ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-attachments', 'quote-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: first folder must equal user uid
CREATE POLICY "company-assets own select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "company-assets own insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "company-assets own update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "company-assets own delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "quote-attachments own select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'quote-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "quote-attachments own insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'quote-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "quote-attachments own update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'quote-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "quote-attachments own delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'quote-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
