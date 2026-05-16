/**
 * Consent-gated script loader.
 *
 * Reads cookie consent from localStorage and only injects analytics / marketing
 * scripts when the user has accepted the corresponding category. Listens for
 * `cookie-consent-updated` events so toggling preferences takes effect
 * immediately (load on grant, no-op until next page load on revoke — recommended
 * to ask the user to refresh after revoking).
 *
 * To enable a provider, set its ID below (or via env var) and the loader will
 * inject the script when consent is granted.
 */

const STORAGE_KEY = "cookie_consent_v1";

type Preferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type StoredConsent = {
  preferences: Preferences;
  timestamp: string;
  version: 1;
};

// ---------- Provider configuration ----------
// Fill these in (or wire to env vars) to activate a provider.
const GA_MEASUREMENT_ID: string | undefined = undefined; // e.g. "G-XXXXXXXXXX"
const META_PIXEL_ID: string | undefined = undefined;     // e.g. "1234567890"

// ---------- State ----------
const loaded = {
  analytics: false,
  marketing: false,
};

function readConsent(): Preferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    return parsed?.preferences ?? null;
  } catch {
    return null;
  }
}

function injectScript(src: string, attrs: Record<string, string> = {}) {
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
  return s;
}

// ---------- Analytics: Google Analytics 4 (example) ----------
function loadAnalytics() {
  if (loaded.analytics) return;
  if (!GA_MEASUREMENT_ID) {
    loaded.analytics = true;
    return;
  }
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`);
  const inline = document.createElement("script");
  inline.text = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
  `;
  document.head.appendChild(inline);
  loaded.analytics = true;
}

// ---------- Marketing: Meta Pixel (example) ----------
function loadMarketing() {
  if (loaded.marketing) return;
  if (!META_PIXEL_ID) {
    loaded.marketing = true;
    return;
  }
  const inline = document.createElement("script");
  inline.text = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${META_PIXEL_ID}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(inline);
  loaded.marketing = true;
}

// ---------- Apply current consent ----------
function applyConsent(prefs: Preferences | null) {
  if (!prefs) return;
  if (prefs.analytics) loadAnalytics();
  if (prefs.marketing) loadMarketing();
}

export function initConsentLoader() {
  applyConsent(readConsent());
  window.addEventListener("cookie-consent-updated", (e) => {
    const detail = (e as CustomEvent<StoredConsent>).detail;
    applyConsent(detail?.preferences ?? readConsent());
  });
}

export function hasConsent(category: "analytics" | "marketing"): boolean {
  const prefs = readConsent();
  return Boolean(prefs?.[category]);
}
