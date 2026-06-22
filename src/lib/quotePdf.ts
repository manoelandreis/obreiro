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
            <td><strong>${esc(m.name)}</strong></td>
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

  const validityLine = q.expiresAt
    ? `<p class="validity-line">Válido até ${new Date(q.expiresAt).toLocaleDateString('pt-PT')}</p>`
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
      <div class="payment-rows">
        ${parts.map((p) => `<div class="payment-row">
          <span class="payment-row-label">${esc(p.label)} <span class="payment-row-pct">(${p.percent}%)</span></span>
          <span class="payment-row-amount">${euro(p.amount)}</span>
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
  @page { size: A4; margin: 16mm 14mm 18mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; font-size: 12px; line-height: 1.45; padding: 16mm 14mm 18mm 14mm; }
  @media print { body { padding: 0; } }


  .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0; }
  .header-left { flex: 1; min-width: 0; }
  .brand-row { display: flex; gap: 12px; align-items: center; }
  .logo { height: 44px; width: 44px; object-fit: contain; border-radius: 8px; flex-shrink: 0; }
  .company-name { font-size: 20px; font-weight: 700; color: ${primary}; line-height: 1.1; }
  .company-meta { margin-top: 10px; }
  .company-meta p { font-size: 11px; color: #64748b; line-height: 1.5; }
  .header-right { text-align: right; flex-shrink: 0; }
  .header-right .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; color: #64748b; }
  .header-right .date { font-size: 12px; color: #475569; margin-top: 4px; }
  .header-right .validity-line { font-size: 11px; color: #64748b; margin-top: 4px; }
  .quote-title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 6px 0 6px; }
  .description { font-size: 12px; color: #475569; margin-bottom: 10px; font-style: italic; }
  .client-line { font-size: 12px; color: #64748b; margin-bottom: 22px; }
  .client-line .sep { margin: 0 6px; color: #cbd5e1; }
  .info-block h3 { font-size: 10px; color: ${accent}; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.8px; font-weight: 700; }
  .info-block p { font-size: 12px; color: #334155; line-height: 1.5; }
  .info-block .name { font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 2px; }

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
  .payment-rows { display: flex; flex-direction: column; gap: 4px; }
  .payment-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 12px; color: #334155; padding: 2px 0; }
  .payment-row-label { flex: 1; min-width: 0; }
  .payment-row-pct { color: #94a3b8; }
  .payment-row-amount { font-weight: 700; color: ${accent}; white-space: nowrap; }

  .watermark { position: fixed; bottom: 8mm; left: 0; right: 0; text-align: center; font-size: 9px; color: #9ca3af; }
  .watermark a { color: ${accent}; text-decoration: none; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="brand-row">
        ${logo ? `<img class="logo" src="${esc(logo)}" alt="Logo" />` : ''}
        <div class="company-name">${esc(q.company.name || 'A Sua Empresa')}</div>
      </div>
      <div class="company-meta">
        ${q.company.nif ? `<p>NIF: ${esc(q.company.nif)}</p>` : ''}
        ${q.company.email ? `<p>${esc(q.company.email)}</p>` : ''}
        ${q.company.phone ? `<p>${esc(q.company.phone)}</p>` : ''}
        ${q.company.address ? `<p>${esc(q.company.address)}</p>` : ''}
      </div>
    </div>
    <div class="header-right">
      <div class="label">ORÇAMENTO</div>
      <div class="date">${new Date(q.createdAt).toLocaleDateString('pt-PT')}</div>
      ${validityLine}
    </div>
  </div>

  <div class="quote-title">${esc(q.title)}</div>
  

  ${q.client.name || q.client.email || q.client.phone || q.client.address ? `<div class="client-line">
    ${[q.client.name, q.client.email, q.client.phone, q.client.address]
      .filter(Boolean)
      .map((v) => esc(v))
      .join('<span class="sep">·</span>')}
  </div>` : ''}



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

function withAutoPrint(html: string) {
  const script = `<script data-obreiro-auto-print>
    (function () {
      var printed = false;
      function triggerPrint() {
        if (printed) return;
        printed = true;
        setTimeout(function () {
          try { window.focus(); window.print(); } catch (e) {}
        }, 250);
      }
      function imageReady(img) {
        if (img.complete) return Promise.resolve();
        if (img.decode) return img.decode().catch(function () {});
        return new Promise(function (resolve) {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      }
      function ready() {
        var images = Array.prototype.slice.call(document.images || []);
        var fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(function () {}) : Promise.resolve();
        Promise.all([fonts, Promise.all(images.map(imageReady))]).then(triggerPrint);
        setTimeout(triggerPrint, 5000);
      }
      if (document.readyState === 'complete') ready();
      else window.addEventListener('load', ready, { once: true });
    })();
  </script>`;
  return html.replace('</body>', `${script}</body>`);
}

export function openPrintWindow(html: string, targetWindow?: Window | null) {
  const printHtml = withAutoPrint(html);
  const blobUrl = URL.createObjectURL(new Blob([printHtml], { type: 'text/html;charset=utf-8' }));
  const win = targetWindow ?? window.open('', '_blank');
  if (!win) {
    URL.revokeObjectURL(blobUrl);
    return false;
  }
  win.location.href = blobUrl;
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  return true;
}

export function useEuroFmt() {
  return euro;
}
