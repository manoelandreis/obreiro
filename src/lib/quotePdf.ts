import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { expandInstallments, presetById, type PaymentTerms } from '@/lib/paymentTerms';

interface MaterialItem { name: string; quantity: number; unit: string; unitPrice: number }
interface ServiceItem { name: string; description?: string; pricePerHour: number; hours: number; materials: MaterialItem[] }

export interface QuoteRenderData {
  title: string;
  company: { name?: string; nif?: string; email?: string; phone?: string; address?: string; iban?: string; mbway?: string };
  client: { name?: string; email?: string; phone?: string; address?: string };
  services: ServiceItem[];
  notes?: string | null;
  subtotal: number;
  iva: number;
  total: number;
  createdAt: string;
  expiresAt?: string | null;
  status?: string;
  paymentTerms?: PaymentTerms | null;
  paymentAnchor?: string | null;
}

export interface BrandSnapshot {
  logoUrl: string | null;     // signed URL
  primary: string;            // hex
  accent: string;
  description: string | null;
  terms: string | null;
  paymentConditions: string | null;
  validityDays: number;
}

export interface RenderOptions {
  brand: BrandSnapshot | null; // null for free tier
  withWatermark: boolean;
  attachmentUrls?: { url: string; caption?: string | null }[];
  publicLink?: string | null;
  hideTotals?: boolean;
}

const euro = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
const esc = (s: any): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function buildQuoteHtml(q: QuoteRenderData, opts: RenderOptions): string {
  const primary = opts.brand?.primary || '#1B3A5C';
  const accent = opts.brand?.accent || '#E8730A';
  const logo = opts.brand?.logoUrl;
  const description = opts.brand?.description;
  const terms = opts.brand?.terms;
  const payment = opts.brand?.paymentConditions;

  const servicesHtml = q.services
    .map((s, idx) => {
      const labor = (s.pricePerHour || 0) * (s.hours || 0);
      const matsTotal = (s.materials || []).reduce(
        (a, m) => a + (m.quantity || 0) * (m.unitPrice || 0),
        0
      );
      const total = labor + matsTotal;
      const laborRow =
        s.hours > 0
          ? `<tr>
              <td><strong>Mão de obra</strong></td>
              <td class="num">${s.hours}</td>
              <td class="center">h</td>
              <td class="num">${euro(s.pricePerHour)}</td>
              <td class="num strong">${euro(labor)}</td>
            </tr>`
          : '';
      const matRows = (s.materials || [])
        .map(
          (m) => `<tr>
            <td>${esc(m.name)}</td>
            <td class="num">${m.quantity}</td>
            <td class="center">${esc(m.unit)}</td>
            <td class="num">${euro(m.unitPrice)}</td>
            <td class="num strong">${euro(m.quantity * m.unitPrice)}</td>
          </tr>`
        )
        .join('');
      const tableHtml =
        laborRow || matRows
          ? `<table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th class="num">Qtd</th>
                  <th class="center">Un.</th>
                  <th class="num">Preço</th>
                  <th class="num">Total</th>
                </tr>
              </thead>
              <tbody>${laborRow}${matRows}</tbody>
            </table>`
          : '';
      return `<div class="service">
        <div class="service-title">${idx + 1}. ${esc(s.name || 'Serviço ' + (idx + 1))}</div>
        ${s.description ? `<div class="service-desc">${esc(s.description)}</div>` : ''}
        ${tableHtml}
        <div class="service-total">Total Serviço: <strong>${euro(total)}</strong></div>
      </div>`;
    })
    .join('');


  const attachmentsHtml =
    opts.attachmentUrls && opts.attachmentUrls.length
      ? `<div class="section attachments">
          <h3>Anexos visuais</h3>
          <div class="grid-photos">
            ${opts.attachmentUrls
              .map(
                (a) => `<div class="photo">
                  <img src="${esc(a.url)}" alt="" />
                  ${a.caption ? `<div class="caption">${esc(a.caption)}</div>` : ''}
                </div>`
              )
              .join('')}
          </div>
        </div>`
      : '';

  const validityHtml = q.expiresAt
    ? `<div class="validity">Válido até <strong>${new Date(q.expiresAt).toLocaleDateString('pt-PT')}</strong></div>`
    : '';

  const paymentTermsHtml = (() => {
    if (!q.paymentTerms) return '';
    const parts = expandInstallments(q.paymentTerms, q.total, q.paymentAnchor ?? q.createdAt);
    const presetLabel = presetById(q.paymentTerms.preset).label;
    return `<div class="payment-block">
      <div class="payment-header">
        <div class="payment-label">Formato de pagamento</div>
        <div class="payment-preset">${esc(presetLabel)}</div>
      </div>
      <div class="payment-cards">
        ${parts.map((p, i) => `<div class="payment-card">
          <div class="payment-card-top">
            <span class="payment-pill">${i + 1}ª · ${p.percent}%</span>
          </div>
          <div class="payment-card-label">${esc(p.label)}</div>
          <div class="payment-card-amount">${euro(p.amount)}</div>
        </div>`).join('')}
      </div>
    </div>`;
  })();

  const paymentHtml = '';

  const termsHtml = terms
    ? `<div class="section terms"><h3>Termos e condições</h3><div class="prewrap small">${esc(terms)}</div></div>`
    : '';

  const watermarkHtml = opts.withWatermark
    ? `<div class="watermark">Orçamento criado com Obreiro — <a href="https://service-flow-mate.lovable.app">crie o seu grátis</a></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<title>${esc(q.title)} — ${esc(q.company.name || 'Obreiro')}</title>
<style>
  @page { size: A4; margin: 18mm 14mm 22mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; font-size: 12px; line-height: 1.45; padding: 18mm 14mm 22mm 14mm; }
  @media print { body { padding: 0; } }
  .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 3px solid ${primary}; }
  .header-left { flex: 1; display: flex; gap: 16px; align-items: center; }
  .logo { max-height: 70px; max-width: 140px; object-fit: contain; }
  .company-name { font-size: 20px; font-weight: 700; color: ${primary}; line-height: 1; text-box-trim: trim-both; text-box-edge: cap alphabetic; }
  .company-meta p { font-size: 11px; color: #555; }
  .header-right { text-align: right; }
  .header-right h2 { font-size: 18px; color: #1e293b; letter-spacing: 1px; }
  .header-right p { font-size: 11px; color: #555; margin-top: 2px; }
  .quote-title { font-size: 16px; font-weight: 600; color: ${primary}; margin: 6px 0 18px; }
  .description { font-size: 12px; color: #475569; margin-bottom: 18px; font-style: italic; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 22px; }
  .info-block h3 { font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
  .info-block p { font-size: 12px; }
  .info-block .name { font-weight: 600; font-size: 13px; }
  .service { margin-bottom: 18px; page-break-inside: avoid; }
  .service-title { font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 3px; }
  .service-desc { font-size: 11px; color: #475569; margin-bottom: 5px; }
  .service-labor { font-size: 11px; color: #475569; margin-bottom: 5px; }
  table { width: 100%; border-collapse: collapse; margin: 5px 0; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { background: #f1f5f9; padding: 5px 7px; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; text-align: left; }
  th.num { text-align: right; } th.center { text-align: center; }
  td { padding: 5px 7px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
  td.num { text-align: right; } td.center { text-align: center; }
  td.strong { font-weight: 600; }
  .service-total { text-align: right; font-size: 12px; color: ${primary}; margin-top: 4px; }
  .totals-row { margin-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; page-break-inside: avoid; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  .payment-info { font-size: 11px; color: #475569; }
  .payment-info p { margin: 2px 0; }
  .totals { text-align: right; page-break-inside: avoid; }
  .totals p { font-size: 12px; color: #475569; margin: 2px 0; }
  .totals .grand { font-size: 17px; font-weight: 700; color: ${primary}; border-top: 2px solid ${primary}; padding-top: 6px; margin-top: 6px; display: inline-block; }
  .accent-bar { height: 3px; background: ${accent}; width: 60px; margin: 14px 0 4px; }
  .validity { margin-top: 12px; padding: 8px 12px; background: ${accent}1a; border-left: 3px solid ${accent}; font-size: 11px; color: #1e293b; }
  .section { margin-top: 20px; page-break-inside: avoid; }
  .section h3 { font-size: 11px; text-transform: uppercase; color: ${primary}; margin-bottom: 6px; letter-spacing: 0.5px; }
  .prewrap { white-space: pre-wrap; font-size: 11px; color: #334155; }
  .prewrap.small { font-size: 10px; color: #475569; }
  .grid-photos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .photo img { width: 100%; height: 140px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; }
  .photo .caption { font-size: 10px; color: #555; margin-top: 3px; text-align: center; }
  .payment-block { margin-top: 22px; padding: 14px 16px; border: 1px solid ${accent}55; border-left: 4px solid ${accent}; border-radius: 8px; background: ${accent}0d; page-break-inside: avoid; }
  .payment-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed ${accent}66; }
  .payment-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: ${primary}; font-weight: 700; }
  .payment-preset { font-size: 12px; color: ${accent}; font-weight: 600; }
  .payment-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
  .payment-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; }
  .payment-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .payment-pill { background: ${primary}; color: #fff; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 10px; }
  .payment-due { font-size: 10px; color: #64748b; }
  .payment-card-label { font-size: 11px; color: #475569; margin-bottom: 3px; }
  .payment-card-amount { font-size: 14px; font-weight: 700; color: ${primary}; }
  .watermark { position: fixed; bottom: 8mm; left: 0; right: 0; text-align: center; font-size: 9px; color: #9ca3af; }
  .watermark a { color: ${accent}; text-decoration: none; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${logo ? `<img class="logo" src="${esc(logo)}" alt="Logo" />` : ''}
      <div>
        <div class="company-name">${esc(q.company.name || 'A Sua Empresa')}</div>
        <div class="company-meta">
          ${q.company.nif ? `<p><span class="meta-label">NIF:</span> ${esc(q.company.nif)}</p>` : ''}
          ${q.company.email ? `<p><span class="meta-label">EMAIL:</span> ${esc(q.company.email)}</p>` : ''}
          ${q.company.phone ? `<p><span class="meta-label">TELEMÓVEL:</span> ${esc(q.company.phone)}</p>` : ''}
          ${q.company.address ? `<p><span class="meta-label">MORADA:</span> ${esc(q.company.address)}</p>` : ''}
        </div>
      </div>
    </div>
    <div class="header-right">
      <h2>ORÇAMENTO</h2>
      <p>Data: ${new Date(q.createdAt).toLocaleDateString('pt-PT')}</p>
    </div>
  </div>

  <div class="quote-title">${esc(q.title)}</div>
  ${description ? `<div class="description">${esc(description)}</div>` : ''}

  <div class="client-row">
    <div class="info-block">
      <h3>Cliente</h3>
      <p class="name">${esc(q.client.name || '—')}</p>
      ${q.client.email ? `<p>${esc(q.client.email)}</p>` : ''}
      ${q.client.phone ? `<p>${esc(q.client.phone)}</p>` : ''}
      ${q.client.address ? `<p>${esc(q.client.address)}</p>` : ''}
    </div>
    ${validityHtml ? `<div class="validity-wrap">${validityHtml}</div>` : ''}
  </div>


  ${servicesHtml}

  ${opts.hideTotals ? '' : `<div class="totals-row">
    <div class="payment-info">
      ${q.company.mbway ? `<p><strong>MBWAY:</strong> ${esc(q.company.mbway)}</p>` : ''}
      ${q.company.iban ? `<p><strong>IBAN:</strong> ${esc(q.company.iban)}</p>` : ''}
    </div>
    <div class="totals">
      <p>Subtotal: ${euro(q.subtotal)}</p>
      <p>IVA (23%): ${euro(q.iva)}</p>
      <p class="grand">Total: ${euro(q.total)}</p>
    </div>
  </div>`}

  ${paymentTermsHtml}
  ${q.notes ? `<div class="section"><h3>Notas</h3><div class="prewrap">${esc(q.notes)}</div></div>` : ''}
  ${paymentHtml}
  ${attachmentsHtml}
  ${termsHtml}

  ${watermarkHtml}
</body>
</html>`;
}

/**
 * Loads brand from app_user_settings, signs the logo URL.
 * Returns null when user has no branding set.
 */
export async function loadBrand(userId: string, allowed: boolean): Promise<BrandSnapshot | null> {
  if (!allowed) return null;
  const { data } = await supabase
    .from('app_user_settings')
    .select(
      'logo_url, brand_color_primary, brand_color_accent, company_description, company_terms, payment_conditions, quote_validity_days'
    )
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  let signedLogo: string | null = null;
  if (data.logo_url) {
    const { data: sig } = await supabase.storage
      .from('company-assets')
      .createSignedUrl(data.logo_url, 60 * 60);
    signedLogo = sig?.signedUrl ?? null;
  }
  return {
    logoUrl: signedLogo,
    primary: data.brand_color_primary || '#1B3A5C',
    accent: data.brand_color_accent || '#E8730A',
    description: data.company_description ?? null,
    terms: data.company_terms ?? null,
    paymentConditions: data.payment_conditions ?? null,
    validityDays: data.quote_validity_days ?? 30,
  };
}

export function openPrintWindow(html: string) {
  const win = window.open('', '_blank');
  if (!win) {
    return false;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
  return true;
}

export function useEuroFmt() {
  return euro;
}
