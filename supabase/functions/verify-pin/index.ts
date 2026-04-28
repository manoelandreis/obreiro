import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  let buf = await crypto.subtle.digest('SHA-256', data);
  for (let i = 0; i < 50_000; i++) {
    buf = await crypto.subtle.digest('SHA-256', buf);
  }
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// In-memory rate limiting (per cold start). Best-effort defense.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

function checkRate(userId: string): boolean {
  const now = Date.now();
  const entry = attempts.get(userId);
  if (!entry || entry.resetAt < now) {
    attempts.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = userData.user.id;

    if (!checkRate(userId)) {
      return new Response(JSON.stringify({ error: 'Demasiadas tentativas. Aguarde 1 minuto.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { pin } = body as { pin?: string };
    if (typeof pin !== 'string' || !/^\d{4,8}$/.test(pin)) {
      return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: settings } = await admin
      .from('app_user_settings')
      .select('pin_enabled, pin_hash, pin_salt')
      .eq('user_id', userId)
      .maybeSingle();

    if (!settings?.pin_enabled || !settings.pin_hash || !settings.pin_salt) {
      return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const candidate = await hashPin(pin, settings.pin_salt);
    // Constant-time compare
    let mismatch = candidate.length !== settings.pin_hash.length ? 1 : 0;
    for (let i = 0; i < candidate.length; i++) {
      mismatch |= candidate.charCodeAt(i) ^ settings.pin_hash.charCodeAt(i);
    }
    const ok = mismatch === 0;

    return new Response(JSON.stringify({ ok }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('verify-pin error', e);
    return new Response(JSON.stringify({ error: 'Erro interno.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
