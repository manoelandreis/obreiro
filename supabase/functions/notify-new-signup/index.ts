import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Triggered by a DB trigger on public.profiles INSERT (via pg_net).
// Fires two emails: an internal alert to the team and a welcome to the user.
// Protected by a shared secret header (SIGNUP_NOTIFY_SECRET), not JWT.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const expected = Deno.env.get('SIGNUP_NOTIFY_SECRET')
  const provided = req.headers.get('x-signup-secret')
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: { user_id?: string; email?: string; display_name?: string; created_at?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { user_id, email, display_name, created_at } = body
  if (!user_id || !email) {
    return new Response(JSON.stringify({ error: 'user_id and email required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const alertTo = Deno.env.get('SIGNUP_ALERT_TO') || 'suporte@obreiro.pt'

  const supabase = createClient(supabaseUrl, serviceKey)

  const invoke = (templateName: string, recipientEmail: string, templateData: Record<string, unknown>, idempotencyKey: string) =>
    supabase.functions.invoke('send-transactional-email', {
      body: { templateName, recipientEmail, templateData, idempotencyKey },
    })

  const results = await Promise.allSettled([
    invoke(
      'signup-alert',
      alertTo,
      {
        userEmail: email,
        displayName: display_name || email,
        signedUpAt: created_at || new Date().toISOString(),
        userId: user_id,
      },
      `signup-alert-${user_id}`,
    ),
    invoke(
      'welcome',
      email,
      {
        displayName: display_name || '',
        appUrl: 'https://www.obreiro.pt/app',
      },
      `welcome-${user_id}`,
    ),
  ])

  const errors = results
    .map((r, i) => (r.status === 'rejected' ? { i, reason: String(r.reason) } : null))
    .filter(Boolean)

  if (errors.length) {
    console.error('notify-new-signup partial failure', { errors })
  }

  return new Response(JSON.stringify({ ok: true, errors }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
