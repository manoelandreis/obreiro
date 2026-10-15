// Quote presentation templates. Stored inside company_snapshot (layout + extras)
// and per-service `details`, so no extra columns are needed and the public RPC returns them.

export type QuoteLayout = 'classic' | 'detailed';

export interface ServiceDetails {
  framing?: string;    // Enquadramento
  objective?: string;  // Objetivo
  steps?: string;      // Etapas do processo — uma por linha
  specs?: string;      // Especificações — uma por linha
}

export interface QuoteExtras {
  estimatedDuration?: string; // ex: "14 dias úteis"
  about?: string;             // Sobre a empresa
  importantNotes?: string;    // Notas importantes — uma por linha
}

export const QUOTE_LAYOUTS: { value: QuoteLayout; label: string; description: string }[] = [
  { value: 'classic', label: 'Clássico', description: 'Lista simples de serviços, materiais e totais.' },
  { value: 'detailed', label: 'Detalhado com separadores', description: 'Resumo por separadores, detalhe técnico por serviço, prazo e notas.' },
];

export const lines = (s?: string | null) =>
  (s || '').split('\n').map((l) => l.trim()).filter(Boolean);

export const hasDetails = (d?: ServiceDetails | null) =>
  !!d && !!(d.framing?.trim() || d.objective?.trim() || d.steps?.trim() || d.specs?.trim());

const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const euro = (v: number) => Number(v || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

/** Extra HTML blocks for the PDF when the detailed layout is used. */
export function buildDetailedHtml(
  services: any[],
  extras: QuoteExtras | null | undefined,
  companyName: string,
): string {
  const blocks = services.map((s, i) => {
    const d: ServiceDetails = s.details || {};
    const mats = (s.materials || []).filter((m: any) => m.name);
    if (!hasDetails(d) && !mats.length) return '';
    const steps = lines(d.steps);
    const specs = lines(d.specs);
    return `<div class="detail-card">
      <div class="detail-head"><span class="detail-num">${String(i + 1).padStart(2, '0')}</span>${esc(s.name || `Serviço ${i + 1}`)} <span class="muted">(Detalhe Técnico)</span></div>
      ${d.framing ? `<p><strong>Enquadramento:</strong> ${esc(d.framing)}</p>` : ''}
      ${d.objective ? `<p><strong>Objetivo:</strong> ${esc(d.objective)}</p>` : ''}
      ${steps.length ? `<h4>Etapas do processo</h4><ol>${steps.map((l) => `<li>${esc(l)}</li>`).join('')}</ol>` : ''}
      ${specs.length ? `<h4>Especificações</h4><ul>${specs.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
      ${mats.length ? `<h4>Materiais aplicados</h4><table class="detail-table"><thead><tr><th>Material / Item</th><th>Qtd.</th><th>Preço/Un.</th></tr></thead><tbody>${mats.map((m: any) => `<tr><td>${esc(m.name)}</td><td>${esc(m.quantity)} ${esc(m.unit)}</td><td>${euro(m.unitPrice)}</td></tr>`).join('')}</tbody></table>` : ''}
    </div>`;
  }).join('');
  const notes = lines(extras?.importantNotes);
  return `${blocks}
  ${extras?.about ? `<div class="about-card"><div class="about-title">${esc(companyName)}</div><p>${esc(extras.about)}</p></div>` : ''}
  ${notes.length ? `<div class="notes-card"><h4>Notas importantes</h4><ul>${notes.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}`;
}

export const DETAILED_PDF_CSS = `
  .duration-pill { display:inline-block; margin-top:8px; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:600; color: var(--brand-accent); background: color-mix(in srgb, var(--brand-accent) 12%, white); }
  .detail-card { margin-top:18px; padding:16px; border:1px solid #e5e7eb; border-radius:14px; page-break-inside: avoid; font-size:12px; }
  .detail-card p { margin:6px 0; }
  .detail-card h4, .notes-card h4 { margin:12px 0 4px; font-size:12px; font-weight:600; }
  .detail-card ol, .detail-card ul, .notes-card ul { margin:0; padding-left:18px; }
  .detail-head { font-family: 'Poppins', sans-serif; font-size:15px; font-weight:600; margin-bottom:8px; }
  .detail-head .muted { color:#6b7280; font-weight:500; font-size:12px; }
  .detail-num { color: var(--brand-accent); font-size:20px; font-weight:700; margin-right:8px; }
  .detail-table { width:100%; border-collapse:collapse; margin-top:4px; }
  .detail-table th { text-align:left; font-size:10px; text-transform:uppercase; color:#6b7280; border-bottom:1px solid #e5e7eb; padding:4px 0; }
  .detail-table td { padding:5px 0; border-bottom:1px solid #f1f5f9; }
  .about-card { margin-top:18px; padding:14px 16px; border-left:3px solid var(--brand-accent); border-radius:10px; background:#f8fafc; font-size:12px; page-break-inside: avoid; }
  .about-title { font-family:'Poppins', sans-serif; font-weight:600; font-size:14px; color: var(--brand-primary); }
  .notes-card { margin-top:14px; padding:12px 16px; border-radius:10px; background:#f8fafc; font-size:11px; page-break-inside: avoid; }
`;
