// Guest quote draft kept in the browser until the visitor creates an account / signs in.
const KEY = 'obreiro-guest-quote-draft';

export interface GuestClient { name: string; email: string | null; phone: string | null; address: string | null; }
export interface GuestDraft {
  title: string;
  services: unknown[];
  notes: string;
  paymentTerms: unknown;
  selectedPaymentKey: string;
  client: GuestClient | null;
}

export const saveGuestDraft = (d: GuestDraft) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ } };
export const loadGuestDraft = (): GuestDraft | null => {
  try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as GuestDraft) : null; } catch { return null; }
};
export const clearGuestDraft = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
export const hasGuestDraft = () => !!loadGuestDraft();
export const postAuthPath = () => (hasGuestDraft() ? '/app/quotes/new' : '/app');
