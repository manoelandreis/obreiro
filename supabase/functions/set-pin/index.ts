import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  // Stretch with multiple SHA-256 rounds for cost
  let buf = await crypto.subtle.digest('SHA-256', data);
  for (let i = 0; i < 50_000; i++) {
    buf = await crypto.subtle.digest('SHA-256', buf);
  }
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
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

    const body = await req.json().catch(() => ({}));
    const { pin, enabled } = body as { pin?: string; enabled?: boolean };

    const admin = createClient(supabaseUrl, serviceKey);

    if (enabled === false) {
      await admin.from('app_user_settings').update({ pin_enabled: false, pin_hash: null, pin_salt: null }).eq('user_id', userId);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (typeof pin !== 'string' || !/^\d{4,8}$/.test(pin)) {
      return new Response(JSON.stringify({ error: 'PIN inválido (4-8 dígitos).' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const salt = generateSalt();
    const hash = await hashPin(pin, salt);

    const { error } = await admin.from('app_user_settings').update({
      pin_enabled: true,
      pin_hash: hash,
      pin_salt: salt,
    }).eq('user_id', userId);

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('set-pin error', e);
    return new Response(JSON.stringify({ error: 'Erro interno.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
