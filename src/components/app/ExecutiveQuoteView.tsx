// Web ("as the client sees it") version of the "Executivo" template.
// Mirrors src/lib/quoteExecutivePdf.ts using existing design tokens.
import { Check } from 'lucide-react';
import { lines } from '@/lib/quoteLayout';
import { DEFAULT_PAYMENT_TERMS, expandInstallments } from '@/lib/paymentTerms';

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '') : '—';

const Label = ({ children, accent }: { children: React.ReactNode; accent?: boolean }) => (
  <div className={`text-[11px] font-bold uppercase tracking-wide ${accent ? 'text-accent' : 'text-muted-foreground'}`}>{children}</div>
);

interface Props {
  quote: any;
  logoUrl: string | null;
}

export function ExecutiveQuoteView({ quote, logoUrl }: Props) {
  const cs = quote.company_snapshot || {};
  const cl = quote.client_snapshot || {};
  const extras = cs.extras || {};
  const services: any[] = quote.services || [];
  const company = cs.name || cs.company_name || 'A Sua Empresa';
  const ref = `ORC-${new Date(quote.created_at).getFullYear()}`;
  const mbway = cs.mbway ?? cs.payment_mbway;
  const iban = cs.iban ?? cs.payment_iban;

  const labor = services.reduce((a, s) => a + (s.pricePerHour || 0) * (s.hours || 0), 0);
  const materials = services.reduce(
    (a, s) => a + (s.materials || []).reduce((b: number, m: any) => b + (m.quantity || 0) * (m.unitPrice || 0), 0), 0);
  const scope = lines(extras.scope);
  const scopeItems = scope.length ? scope : services.map((s) => s.name).filter(Boolean);
  const description = services.length === 1 ? services[0].description : null;
  const parts = expandInstallments(
    quote.payment_terms ?? DEFAULT_PAYMENT_TERMS,
    Number(quote.total),
    quote.responded_at ?? quote.sent_at ?? quote.created_at,
  );
  const meta = [cs.nif ? `NIF ${cs.nif}` : '', cs.email, cs.phone].filter(Boolean).join(' · ');
  const [signerName, ...signerRest] = String(extras.signer || '').split('·').map((x) => x.trim());

  return (
    <div className="space-y-5">
      {/* Header + facts */}
      <div className="rounded-xl overflow-hidden bg-card shadow-sm border">
        <div className="bg-brand-dark text-brand-dark-foreground px-6 sm:px-10 pt-8 pb-16 flex flex-wrap justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {logoUrl && cs.logo_path && (
              <img src={logoUrl} alt="Logo" className="h-11 max-w-[132px] object-contain"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
            )}
            <div className="min-w-0">
              <div className="font-heading text-lg font-semibold leading-7">{company}</div>
              {meta && <div className="text-xs opacity-80">{meta}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase opacity-80">Orçamento</div>
            <div className="font-mono text-sm">{ref}</div>
          </div>
        </div>
        <div className="-mt-10 mx-4 sm:mx-10 bg-card rounded-lg shadow-md grid grid-cols-2 sm:grid-cols-4 py-4 gap-y-3">
          {[
            ['Data', fmtDate(quote.created_at)],
            ['Validade', fmtDate(quote.expires_at)],
            ['Cliente', cl.name || '—'],
            ['Local da obra', cl.address || '—'],
          ].map(([k, v], i) => (
            <div key={k} className={`px-4 ${i % 2 ? 'border-l' : ''} ${i === 2 ? 'sm:border-l' : ''}`}>
              <Label>{k}</Label>
              <div className="text-sm font-semibold break-words">{v}</div>
            </div>
          ))}
        </div>

        <div className="px-6 sm:px-10 py-8 space-y-6">
          <div>
            <h1 className="font-heading text-2xl font-semibold">{quote.title}</h1>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>

          <div className="grid md:grid-cols-[1fr_minmax(0,300px)] gap-6">
            <div>
              <Label accent>Âmbito dos trabalhos</Label>
              <ul className="mt-3 space-y-2.5">
                {scopeItems.map((l, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <span className="h-5 w-5 rounded-md bg-accent/15 text-accent flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {l}
                  </li>
                ))}
              </ul>
              {quote.notes && (
                <div className="mt-4 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</div>
              )}
            </div>
            <div className="rounded-xl bg-brand-dark text-brand-dark-foreground p-5 flex flex-col">
              <div className="text-[11px] font-bold uppercase opacity-80 mb-3">Resumo financeiro</div>
              {[['Mão de obra', labor], ['Materiais', materials], ['IVA (23%)', Number(quote.iva)]].map(([k, v]) => (
                <div key={k as string} className="flex justify-between py-1.5 text-sm border-b border-brand-dark-foreground/25">
                  <span>{k}</span><span>{fmt(v as number)}</span>
                </div>
              ))}
              <div className="mt-6 md:mt-auto pt-6">
                <div className="text-[11px] font-bold uppercase opacity-80">Total com IVA</div>
                <div className="font-heading text-3xl font-bold">{fmt(quote.total)}</div>
              </div>
            </div>
          </div>

          <div>
            <Label accent>Condições de pagamento</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              {parts.map((p: any, i: number) => (
                <div key={i} className="rounded-lg border border-accent/35 bg-accent/5 px-4 py-3">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-heading text-lg font-bold text-accent">{p.percent}%</span>
                    <span className="text-xs text-muted-foreground">{p.label}</span>
                  </div>
                  <div className="font-semibold">{fmt(p.amount)}</div>
                </div>
              ))}
            </div>
            {(mbway || iban) && (
              <div className="mt-3 text-xs text-muted-foreground flex flex-wrap gap-x-5 gap-y-1">
                {mbway && <span>MBWAY <b className="font-semibold text-foreground">{mbway}</b></span>}
                {iban && <span>IBAN <b className="font-semibold text-foreground">{iban}</b></span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Services detail */}
      <div className="rounded-xl bg-card shadow-sm border px-6 sm:px-10 py-8">
        <Label accent>Detalhe dos serviços</Label>
        <h2 className="font-heading text-lg font-semibold">{quote.title}</h2>
        <div className="space-y-4 mt-4">
          {services.map((s, i) => {
            const lab = (s.pricePerHour || 0) * (s.hours || 0);
            const mats = (s.materials || []).filter((m: any) => m.name);
            const total = lab + mats.reduce((a: number, m: any) => a + m.quantity * m.unitPrice, 0);
            const rows = [
              ...(s.hours > 0 ? [{ name: 'Mão de obra', sub: s.description, qty: `${s.hours} h`, unit: s.pricePerHour, total: lab }] : []),
              ...mats.map((m: any) => {
                const [n, ...rest] = String(m.name).split('·');
                return { name: n.trim(), sub: rest.join('·').trim(), qty: `${m.quantity} ${m.unit}`, unit: m.unitPrice, total: m.quantity * m.unitPrice };
              }),
            ];
            return (
              <div key={i} className="rounded-lg border overflow-hidden">
                <div className="flex items-center gap-3 bg-muted/50 px-4 py-2.5">
                  <span className="h-6 w-6 rounded-full bg-brand-dark text-brand-dark-foreground text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="font-heading font-medium text-sm flex-1">{s.name || `Serviço ${i + 1}`}</span>
                  <span className="font-heading font-semibold text-sm text-accent">{fmt(total)}</span>
                </div>
                {rows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase text-muted-foreground border-b">
                          <th className="text-left font-bold px-4 py-2">Descrição</th>
                          <th className="text-right font-bold px-4 py-2">Qtd</th>
                          <th className="text-right font-bold px-4 py-2 hidden sm:table-cell">Preço un.</th>
                          <th className="text-right font-bold px-4 py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, ri) => (
                          <tr key={ri} className="border-b last:border-0">
                            <td className="px-4 py-2"><b className="font-semibold">{r.name}</b>{r.sub && <span className="text-muted-foreground"> · {r.sub}</span>}</td>
                            <td className="px-4 py-2 text-right whitespace-nowrap">{r.qty}</td>
                            <td className="px-4 py-2 text-right whitespace-nowrap hidden sm:table-cell">{fmt(r.unit)}</td>
                            <td className="px-4 py-2 text-right whitespace-nowrap font-semibold">{fmt(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-72 text-sm">
            <div className="flex justify-between py-0.5 text-muted-foreground"><span>Subtotal</span><span>{fmt(quote.subtotal)}</span></div>
            <div className="flex justify-between py-0.5 text-muted-foreground"><span>IVA (23%)</span><span>{fmt(quote.iva)}</span></div>
            <div className="flex justify-between items-baseline border-t-2 border-foreground mt-1 pt-2 font-semibold">
              <span>Total</span><span className="font-heading text-lg text-accent">{fmt(quote.total)}</span>
            </div>
          </div>
        </div>
        {(extras.signer || company) && (
          <div className="mt-8 max-w-xs border-t border-foreground pt-2">
            <div className="font-semibold text-sm">{signerName || company}</div>
            <div className="text-xs text-muted-foreground">{[...signerRest, signerName ? company : ''].filter(Boolean).join(' · ')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
