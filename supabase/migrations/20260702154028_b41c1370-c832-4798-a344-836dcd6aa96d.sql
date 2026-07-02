CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'pro', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Upgrade all existing free users to pro for MVP
UPDATE public.user_subscriptions
SET tier = 'pro', status = 'active', updated_at = now()
WHERE tier = 'free';