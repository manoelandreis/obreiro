-- Prevent the PIN hash and salt from ever being returned to the client.
-- RLS still gates row access; this further restricts which columns the
-- authenticated role can SELECT. The set-pin / verify-pin edge functions use
-- the service role and are unaffected.
REVOKE SELECT (pin_hash, pin_salt) ON public.app_user_settings FROM anon, authenticated;