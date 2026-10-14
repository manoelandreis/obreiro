import { supabase } from '@/integrations/supabase/client';

export interface DuplicateResult {
  id?: string;
  error?: 'quota' | 'generic';
}

/**
 * Duplicates an existing quote as a new draft (rascunho) with a fresh public
 * link. Copies client/brand snapshots, services, notes, payment terms, totals
 * and photos. Does not copy status, sent/viewed/responded timestamps, expiry
 * or the associated job.
 */
export async function duplicateQuote(sourceId: string, userId: string): Promise<DuplicateResult> {
  const { data: src, error: fetchErr } = await supabase
    .from('app_quotes')
    .select('*')
    .eq('id', sourceId)
    .maybeSingle();
  if (fetchErr || !src) return { error: 'generic' };

  const { data: created, error: insertErr } = await supabase
    .from('app_quotes')
    .insert({
      user_id: userId,
      client_id: src.client_id ?? null,
      title: `${src.title ?? 'Orçamento'} (cópia)`,
      company_snapshot: src.company_snapshot ?? null,
      client_snapshot: src.client_snapshot ?? null,
      services: src.services ?? [],
      notes: src.notes ?? null,
      payment_terms: src.payment_terms ?? null,
      subtotal: src.subtotal ?? 0,
      iva: src.iva ?? 0,
      total: src.total ?? 0,
      status: 'rascunho',
    })
    .select('id')
    .maybeSingle();

  if (insertErr || !created) {
    if (String(insertErr?.message || '').includes('quota_exceeded')) return { error: 'quota' };
    return { error: 'generic' };
  }

  // Best-effort copy of photos/attachments into the new quote.
  const { data: atts } = await supabase
    .from('quote_attachments')
    .select('storage_path, caption, sort_order, type')
    .eq('quote_id', sourceId)
    .order('sort_order');

  if (atts?.length) {
    for (const a of atts) {
      try {
        const { data: sig } = await supabase.storage
          .from('quote-attachments')
          .createSignedUrl(a.storage_path, 60);
        if (!sig?.signedUrl) continue;
        const res = await fetch(sig.signedUrl);
        if (!res.ok) continue;
        const blob = await res.blob();
        const ext = String(a.storage_path).split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
        const newPath = `${userId}/${created.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('quote-attachments')
          .upload(newPath, blob, { contentType: blob.type || undefined });
        if (upErr) continue;
        await supabase.from('quote_attachments').insert({
          quote_id: created.id,
          user_id: userId,
          type: a.type ?? 'photo',
          storage_path: newPath,
          caption: a.caption ?? null,
          sort_order: a.sort_order ?? 0,
        });
      } catch {
        // skip failed attachment copies
      }
    }
  }

  return { id: created.id };
}
