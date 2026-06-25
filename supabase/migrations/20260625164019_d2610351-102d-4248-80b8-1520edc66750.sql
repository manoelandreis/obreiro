-- Enable pg_net (idempotent) to allow database -> edge function HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: fires async HTTP POST to the notify-new-signup edge function
CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  project_url text := 'https://cprysybqjtsynxofljxc.supabase.co';
  secret text;
BEGIN
  -- Read shared secret from vault if present; fall back to a hardcoded match of edge secret
  BEGIN
    SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = 'SIGNUP_NOTIFY_SECRET' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    secret := NULL;
  END;

  IF secret IS NULL THEN
    secret := 'obrx_nty_8fK3pQ2xWmR7vL9sB4nT6cZ1jH0yE5aD';
  END IF;

  PERFORM extensions.http_post(
    url := project_url || '/functions/v1/notify-new-signup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-signup-secret', secret
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'email', NEW.email,
      'display_name', NEW.display_name,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block signup if notification dispatch fails
  RAISE WARNING 'notify_new_signup dispatch failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_profile_notify ON public.profiles;
CREATE TRIGGER on_new_profile_notify
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_signup();