// Public-facing wrapper around the internal transactional email sender.
// Adds: input validation, allowed-template whitelist, recipient = single email
// the visitor entered, body-size cap, per-IP rate limiting, and idempotency.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_TEMPLATES = new Set(['quote-delivery']);
const MAX_BODY_BYTES = 32 * 1024; // 32 KB
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1h
const RATE_MAX_PER_IP = 10; // 10 emails per IP per hour
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'Payload too large.' }, 413);
    }
    let body: any;
    try { body = JSON.parse(raw); } catch { return jsonResponse({ error: 'Invalid JSON.' }, 400); }

    const { templateName, recipientEmail, idempotencyKey, templateData } = body ?? {};

    if (typeof templateName !== 'string' || !ALLOWED_TEMPLATES.has(templateName)) {
      return jsonResponse({ error: 'Template not allowed.' }, 400);
    }
    if (typeof recipientEmail !== 'string' || recipientEmail.length > 254 || !EMAIL_RE.test(recipientEmail)) {
      return jsonResponse({ error: 'Invalid email.' }, 400);
    }
    if (idempotencyKey !== undefined && (typeof idempotencyKey !== 'string' || idempotencyKey.length > 128)) {
      return jsonResponse({ error: 'Invalid idempotency key.' }, 400);
    }
    if (templateData && (typeof templateData !== 'object' || Array.isArray(templateData))) {
      return jsonResponse({ error: 'Invalid template data.' }, 400);
    }

    // Strict per-field validation + HTML escaping for quote-delivery template.
    const MAX_STR = 200;
    const MAX_SERVICES = 50;
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const cleanStr = (v: unknown, max = MAX_STR): string | null => {
      if (v === undefined || v === null || v === '') return '';
      if (typeof v !== 'string') return null;
      if (v.length > max) return null;
      return escapeHtml(v.trim());
    };

    let safeTemplateData: Record<string, unknown> | undefined;
    if (templateName === 'quote-delivery' && templateData) {
      const td = templateData as Record<string, unknown>;
      const companyName = cleanStr(td.companyName);
      const clientName = cleanStr(td.clientName);
      const total = cleanStr(td.total, 40);
      const subtotal = cleanStr(td.subtotal, 40);
      const iva = cleanStr(td.iva, 40);
      if ([companyName, clientName, total, subtotal, iva].some((v) => v === null)) {
        return jsonResponse({ error: 'Invalid template data fields.' }, 400);
      }
      let safeServices: Array<Record<string, string>> = [];
      if (td.services !== undefined) {
        if (!Array.isArray(td.services) || td.services.length > MAX_SERVICES) {
          return jsonResponse({ error: 'Invalid services.' }, 400);
        }
        for (const s of td.services as unknown[]) {
          if (!s || typeof s !== 'object') return jsonResponse({ error: 'Invalid service.' }, 400);
          const so = s as Record<string, unknown>;
          const name = cleanStr(so.name);
          const laborTotal = cleanStr(so.laborTotal, 40);
          const materialsTotal = cleanStr(so.materialsTotal, 40);
          const sTotal = cleanStr(so.total, 40);
          if ([name, laborTotal, materialsTotal, sTotal].some((v) => v === null)) {
            return jsonResponse({ error: 'Invalid service fields.' }, 400);
          }
          safeServices.push({ name: name!, laborTotal: laborTotal!, materialsTotal: materialsTotal!, total: sTotal! });
        }
      }
      safeTemplateData = {
        companyName, clientName, total, subtotal, iva, services: safeServices,
      };
    }

    const ipRaw = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
    const ipHash = await sha256(ipRaw + '|' + (Deno.env.get('SUPABASE_JWKS') ?? 'salt'));

    const admin = createClient(supabaseUrl, serviceKey);

    // Idempotency: if same key already used, return success without resending.
    if (idempotencyKey) {
      const { data: existing } = await admin
        .from('public_email_send_log')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .limit(1)
        .maybeSingle();
      if (existing) return jsonResponse({ ok: true, deduped: true });
    }

    // Per-IP rate limit.
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const { count } = await admin
      .from('public_email_send_log')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since);
    if ((count ?? 0) >= RATE_MAX_PER_IP) {
      return jsonResponse({ error: 'Demasiados pedidos. Tente novamente mais tarde.' }, 429);
    }

    // Log first so concurrent requests count toward the limit.
    await admin.from('public_email_send_log').insert({
      ip_hash: ipHash,
      email: recipientEmail.toLowerCase(),
      template: templateName,
      idempotency_key: idempotencyKey ?? null,
    });

    // Delegate the actual send to the internal transactional sender using service role.
    const { error } = await admin.functions.invoke('send-transactional-email', {
      body: { templateName, recipientEmail, idempotencyKey, templateData: safeTemplateData ?? templateData },
    });
    if (error) {
      console.error('send-quote-email upstream error', error);
      return jsonResponse({ error: 'Falha ao enviar email.' }, 502);
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    console.error('send-quote-email error', e);
    return jsonResponse({ error: 'Erro interno.' }, 500);
  }
});
