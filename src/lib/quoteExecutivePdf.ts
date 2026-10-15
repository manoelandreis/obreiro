// "Executivo" PDF template (Figma: Template 2 — Orçamento simples).
// Page 1: overview (header, quote facts, scope, financial summary, payment, signatures).
// Page 2+: per-service detail tables with notes and totals.
import { QUOTE_FONT_CSS } from '@/lib/quotePdfFonts';
import { lines } from '@/lib/quoteLayout';
import { DEFAULT_PAYMENT_TERMS, expandInstallments } from '@/lib/paymentTerms';
import type { QuoteRenderData, RenderOptions } from '@/lib/quotePdf';

const euro = (v: number) => Number(v || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const HEX = /^#[0-9a-fA-F]{3,8}$/;
const hex = (v: string | undefined, f: string) => (v && HEX.test(v) ? v : f);
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '') : '—';

export function buildExecutiveHtml(q: QuoteRenderData, opts: RenderOptions): string {
  const primary = hex(opts.brand?.primary, '#1B3A5C');
  const accent = hex(opts.brand?.accent, '#E8730A');
  const logo = opts.brand?.logoUrl;
  const company = q.company.name || 'A Sua Empresa';
  const ref = `ORC-${new Date(q.createdAt).getFullYear()}`;

  const labor = q.services.reduce((a, s) => a + (s.pricePerHour || 0) * (s.hours || 0), 0);
  const materials = q.services.reduce(
    (a, s) => a + (s.materials || []).reduce((b, m) => b + (m.quantity || 0) * (m.unitPrice || 0), 0), 0);

  const scope = lines(q.extras?.scope);
  const scopeItems = scope.length ? scope : q.services.map((s) => s.name).filter(Boolean);
  const note = q.notes || opts.brand?.paymentConditions || '';
  const description = q.services.length === 1 ? q.services[0].description : opts.brand?.description;

  const terms = q.paymentTerms ?? DEFAULT_PAYMENT_TERMS;
  const parts = expandInstallments(terms, q.total, q.paymentAnchor ?? q.createdAt);
  const payInfo = [
    q.company.mbway ? `MBWAY&nbsp; ${esc(q.company.mbway)}` : '',
    q.company.iban ? `IBAN&nbsp; ${esc(q.company.iban)}` : '',
  ].filter(Boolean).join('<span class="dot">·</span>');

  const meta = [q.company.nif ? `NIF ${esc(q.company.nif)}` : '', esc(q.company.email || ''), esc(q.company.phone || '')]
    .filter(Boolean).join(' · ');

  const [signerName, ...signerRest] = (q.extras?.signer || '').split('·').map((x) => x.trim());
  const footer = (page: string) => `<div class="footer"><span>${esc(company)}${q.company.nif ? ` · NIF ${esc(q.company.nif)}` : ''}</span><span>${page}Powered by <b>Obreiro</b></span></div>`;

  const servicesHtml = q.services.map((s, i) => {
    const lab = (s.pricePerHour || 0) * (s.hours || 0);
    const mats = (s.materials || []).filter((m) => m.name);
    const total = lab + mats.reduce((a, m) => a + m.quantity * m.unitPrice, 0);
    const rows = [
      s.hours > 0 ? `<tr><td><b>Mão de obra</b>${s.description ? `<span class="m"> · ${esc(s.description)}</span>` : ''}</td><td>${s.hours} h</td><td>${euro(s.pricePerHour)}</td><td><b>${euro(lab)}</b></td></tr>` : '',
      ...mats.map((m) => {
        const [n, ...rest] = String(m.name).split('·');
        return `<tr><td><b>${esc(n.trim())}</b>${rest.length ? `<span class="m"> · ${esc(rest.join('·').trim())}</span>` : ''}</td><td>${m.quantity} ${esc(m.unit)}</td><td>${euro(m.unitPrice)}</td><td><b>${euro(m.quantity * m.unitPrice)}</b></td></tr>`;
      }),
    ].join('');
    return `<div class="svc">
      <div class="svc-head"><span class="n">${i + 1}</span><span class="svc-name">${esc(s.name || `Serviço ${i + 1}`)}</span><span class="svc-total">${euro(total)}</span></div>
      ${rows ? `<table><thead><tr><th>Descrição</th><th>Qtd</th><th>Preço un.</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt"><head><meta charset="UTF-8"><title>${esc(q.title)} — ${esc(company)}</title>
<style>
${QUOTE_FONT_CSS}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
:root { --p: ${primary}; --a: ${accent}; --ink: #0f1b2a; --mut: #555; --line: #eceef0; --soft: #f7f8f9; }
body { font-family: 'Inter', Arial, sans-serif; color: var(--ink); font-size: 12px; line-height: 1.5; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sheet { width: 210mm; min-height: 297mm; position: relative; padding-bottom: 64px; page-break-after: always; break-after: page; }
.sheet:last-child { page-break-after: auto; break-after: auto; }
.label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--mut); }
.label.a { color: var(--a); }
.hero { background: var(--p); color: #fff; height: 168px; padding: 36px 48px 0; display: flex; justify-content: space-between; align-items: flex-start; }
.co { display: flex; gap: 16px; align-items: center; }
.co img { height: 44px; max-width: 132px; object-fit: contain; }
.co h1 { font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 600; line-height: 28px; }
.co p { font-size: 10px; opacity: .8; }
.ref { text-align: right; } .ref .label { color: #fff; opacity: .8; } .ref .code { font-family: ui-monospace, monospace; font-size: 13px; }
.facts { margin: -44px 48px 0; background: #fff; border-radius: 10px; box-shadow: 0 4px 16px rgba(15,27,42,.10); display: grid; grid-template-columns: repeat(4,1fr); padding: 19px 9px; }
.facts > div { padding: 0 16px; } .facts > div + div { border-left: 1px solid var(--line); }
.facts b { display: block; font-size: 11px; font-weight: 600; }
.body { padding: 28px 48px 0; }
.title h2 { font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 600; line-height: 36px; }
.title p { color: var(--mut); margin-top: 4px; }
.grid { display: grid; grid-template-columns: 374px 1fr; gap: 24px; margin-top: 24px; }
.scope ul { list-style: none; margin-top: 14px; } .scope li { display: flex; gap: 10px; margin-bottom: 10px; }
.chk { width: 18px; height: 18px; border-radius: 5px; background: color-mix(in srgb, var(--a) 14%, white); color: var(--a); font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.note { margin-top: 4px; background: var(--soft); border: 1px solid var(--line); border-radius: 10px; padding: 15px 17px; font-size: 11px; color: var(--mut); white-space: pre-wrap; }
.fin { background: var(--p); color: #fff; border-radius: 12px; padding: 22px; display: flex; flex-direction: column; min-height: 390px; }
.fin .label { color: #fff; opacity: .8; margin-bottom: 12px; }
.fin .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.25); }
.fin .grand { margin-top: auto; } .fin .grand b { display: block; font-family: 'Poppins', sans-serif; font-size: 28px; font-weight: 700; line-height: 40px; }
.pay { margin-top: 24px; } .parts { display: grid; grid-template-columns: repeat(${Math.max(1, Math.min(parts.length, 4))},1fr); gap: 12px; margin-top: 10px; }
.part { border: 1px solid color-mix(in srgb, var(--a) 35%, white); background: color-mix(in srgb, var(--a) 5%, white); border-radius: 10px; padding: 13px 15px; }
.part .top { display: flex; justify-content: space-between; align-items: baseline; }
.part .pct { font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 700; color: var(--a); }
.part .when { font-size: 10px; color: var(--mut); }
.payinfo { margin-top: 10px; font-size: 10px; color: var(--mut); } .dot { margin: 0 10px; }
.sign { position: absolute; left: 48px; right: 48px; bottom: 64px; display: grid; grid-template-columns: 270px 1fr; gap: 24px; align-items: end; }
.sig-co { border-top: 1px solid var(--ink); padding-top: 6px; } .sig-co small { display: block; font-size: 10px; color: var(--mut); }
.accept { border: 1px solid var(--line); border-radius: 10px; padding: 15px 19px; }
.accept .two { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 6px; }
.field { font-size: 10px; color: var(--mut); border-bottom: 1px solid var(--line); padding-bottom: 12px; margin-bottom: 6px; } .field.big { padding-bottom: 24px; }
.footer { position: absolute; left: 48px; right: 48px; bottom: 24px; display: flex; justify-content: space-between; font-size: 10px; color: var(--mut); }
.footer b { color: var(--a); font-weight: 600; }
.mini { background: var(--p); color: #fff; height: 72px; padding: 20px 48px; display: flex; justify-content: space-between; align-items: center; }
.mini .co img { height: 32px; max-width: 96px; } .mini .co h1 { font-size: 15px; line-height: 24px; }
.svc { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; margin-top: 18px; break-inside: avoid; }
.svc-head { display: flex; align-items: center; gap: 10px; background: var(--soft); padding: 10px 16px; }
.n { width: 24px; height: 24px; border-radius: 999px; background: var(--p); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.svc-name { font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 13px; flex: 1; }
.svc-total { font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13px; color: var(--a); }
table { width: 100%; border-collapse: collapse; font-size: 11px; }
th { font-size: 9px; text-transform: uppercase; font-weight: 700; color: var(--mut); text-align: right; padding: 7px 16px; border-bottom: 1px solid var(--line); }
td { padding: 7px 16px; text-align: right; border-bottom: 1px solid var(--line); white-space: nowrap; }
tr:last-child td { border-bottom: 0; }
th:first-child, td:first-child { text-align: left; white-space: normal; width: 58%; }
td .m { color: var(--mut); }
.end { display: grid; grid-template-columns: 394px 1fr; gap: 24px; margin-top: 20px; break-inside: avoid; }
.end p { font-size: 11px; color: var(--mut); margin-top: 6px; white-space: pre-wrap; }
.tot .row { display: flex; justify-content: space-between; padding: 3px 0; color: var(--mut); }
.tot .grand { border-top: 2px solid var(--ink); margin-top: 3px; padding-top: 8px; display: flex; justify-content: space-between; align-items: baseline; font-weight: 600; }
.tot .grand b { font-family: 'Poppins', sans-serif; font-size: 18px; color: var(--a); }
</style></head><body>
<section class="sheet">
  <div class="hero">
    <div class="co">${logo ? `<img src="${esc(logo)}" alt="Logo" />` : ''}<div><h1>${esc(company)}</h1>${meta ? `<p>${meta}</p>` : ''}</div></div>
    <div class="ref"><div class="label">Orçamento</div><div class="code">${ref}</div></div>
  </div>
  <div class="facts">
    <div><span class="label">Data</span><b>${fmtDate(q.createdAt)}</b></div>
    <div><span class="label">Validade</span><b>${fmtDate(q.expiresAt)}</b></div>
    <div><span class="label">Cliente</span><b>${esc(q.client.name || '—')}</b></div>
    <div><span class="label">Local da obra</span><b>${esc(q.client.address || '—')}</b></div>
  </div>
  <div class="body">
    <div class="title"><h2>${esc(q.title)}</h2>${description ? `<p>${esc(description)}</p>` : ''}</div>
    <div class="grid">
      <div class="scope">
        <div class="label a">Âmbito dos trabalhos</div>
        <ul>${scopeItems.map((l) => `<li><span class="chk">✓</span>${esc(l)}</li>`).join('')}</ul>
        ${note ? `<div class="note">${esc(note)}</div>` : ''}
      </div>
      <div class="fin">
        <div class="label">Resumo financeiro</div>
        <div class="row"><span>Mão de obra</span><span>${euro(labor)}</span></div>
        <div class="row"><span>Materiais</span><span>${euro(materials)}</span></div>
        <div class="row"><span>IVA (23%)</span><span>${euro(q.iva)}</span></div>
        <div class="grand"><span class="label">Total com IVA</span><b>${euro(q.total)}</b></div>
      </div>
    </div>
    <div class="pay">
      <div class="label a">Condições de pagamento</div>
      <div class="parts">${parts.map((p) => `<div class="part"><div class="top"><span class="pct">${p.percent}%</span><span class="when">${esc(p.label)}</span></div><b>${euro(p.amount)}</b></div>`).join('')}</div>
      ${payInfo ? `<div class="payinfo">${payInfo}</div>` : ''}
    </div>
  </div>
  <div class="sign">
    <div class="sig-co"><b>${esc(signerName || company)}</b><small>${esc([...signerRest, signerName ? company : ''].filter(Boolean).join(' · '))}</small></div>
    <div class="accept"><div class="label">Aceitação do cliente</div>
      <div class="two"><div class="field">Nome</div><div class="field">Data</div></div>
      <div class="field big">Assinatura</div>
    </div>
  </div>
  ${footer('Página 1 · ')}
</section>
<section class="sheet">
  <div class="mini"><div class="co">${logo ? `<img src="${esc(logo)}" alt="Logo" />` : ''}<h1>${esc(company)}</h1></div><span class="code" style="font-family:ui-monospace,monospace">${ref}</span></div>
  <div class="body">
    <div class="label a">Detalhe dos serviços</div>
    <h2 style="font-family:'Poppins',sans-serif;font-size:18px;font-weight:600">${esc(q.title)}</h2>
    ${servicesHtml}
    <div class="end">
      <div>${note ? `<div class="label" style="color:var(--ink)">Notas</div><p>${esc(note)}</p>` : ''}</div>
      <div class="tot">
        <div class="row"><span>Subtotal</span><span>${euro(q.subtotal)}</span></div>
        <div class="row"><span>IVA (23%)</span><span>${euro(q.iva)}</span></div>
        <div class="grand"><span>Total</span><b>${euro(q.total)}</b></div>
      </div>
    </div>
  </div>
  ${footer('Página 2 · ')}
</section>
</body></html>`;
}
