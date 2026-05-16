/**
 * External integrations (Sprint D)
 *
 * Configure via Vite env vars (add to your hosting provider, NOT to .env which is auto-managed):
 *   VITE_POSTHOG_KEY        - PostHog project key (e.g. phc_xxx)
 *   VITE_POSTHOG_HOST       - PostHog host (default: https://eu.i.posthog.com)
 *   VITE_CRISP_WEBSITE_ID   - Crisp website ID (from Crisp settings)
 *
 * If env vars are missing, integrations are silently no-op.
 *
 * Loops.so (email sequences on signup) lives in the edge function `lead-capture`
 * — add a LOOPS_API_KEY secret in Supabase to enable; see `src/lib/integrations/README.md`.
 */

let posthogLoaded = false;

export async function initPosthog() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key || posthogLoaded || typeof window === 'undefined') return;
  posthogLoaded = true;
  const host = (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://eu.i.posthog.com';
  try {
    const { default: posthog } = await import('posthog-js');
    posthog.init(key, {
      api_host: host,
      capture_pageview: true,
      person_profiles: 'identified_only',
    });
    (window as any).posthog = posthog;
  } catch (e) {
    console.warn('[posthog] failed to init', e);
  }
}

export function identifyPosthog(userId: string, traits?: Record<string, any>) {
  const ph = (typeof window !== 'undefined' && (window as any).posthog) as any;
  if (ph?.identify) ph.identify(userId, traits);
}

export function trackPosthog(event: string, props?: Record<string, any>) {
  const ph = (typeof window !== 'undefined' && (window as any).posthog) as any;
  if (ph?.capture) ph.capture(event, props);
}

let crispLoaded = false;

export function initCrisp() {
  const id = import.meta.env.VITE_CRISP_WEBSITE_ID as string | undefined;
  if (!id || crispLoaded || typeof window === 'undefined') return;
  crispLoaded = true;
  (window as any).$crisp = [];
  (window as any).CRISP_WEBSITE_ID = id;
  const s = document.createElement('script');
  s.src = 'https://client.crisp.chat/l.js';
  s.async = true;
  document.head.appendChild(s);
}

export function identifyCrisp(email: string, name?: string) {
  const c = (typeof window !== 'undefined' && (window as any).$crisp) as any;
  if (!c?.push) return;
  c.push(['set', 'user:email', [email]]);
  if (name) c.push(['set', 'user:nickname', [name]]);
}
