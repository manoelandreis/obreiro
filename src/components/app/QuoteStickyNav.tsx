import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { presetById, type PaymentTerms } from '@/lib/paymentTerms';

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export const paymentLabel = (pt: PaymentTerms) =>
  pt.preset !== 'custom'
    ? presetById(pt.preset)?.label ?? ''
    : (pt.installments || []).map((i) => `${i.percent}%`).join(' + ');

interface Props {
  serviceCount: number;
  total: number;
  paymentTerms: PaymentTerms;
}

/** Sticky navigation for the detailed template: jumps to the summary or each service's technical detail, and always shows total + payment terms. */
export function QuoteStickyNav({ serviceCount, total, paymentTerms }: Props) {
  const ids = ['quote-summary', ...Array.from({ length: serviceCount }, (_, i) => `svc-detail-${i}`)];
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-140px 0px -55% 0px' },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceCount]);

  const go = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 pt-2 pb-2 bg-muted/90 backdrop-blur supports-[backdrop-filter]:bg-muted/70">
      <nav aria-label="Secções do orçamento" className="flex h-10 items-center gap-1 overflow-x-auto rounded-md border border-muted bg-secondary px-1">
        {ids.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            aria-current={active === id ? 'true' : undefined}
            className={cn(
              'flex-1 shrink-0 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-bold leading-5 transition-colors',
              active === id ? 'bg-brand-dark text-primary-foreground shadow-sm' : 'text-secondary-foreground hover:bg-background/60',
            )}
          >
            {i === 0 ? 'Resumo' : (<><span className="sm:hidden">Serv. {i}</span><span className="hidden sm:inline">Serviço {i}</span></>)}
          </button>
        ))}
      </nav>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground truncate">Pagamento: <span className="font-medium text-foreground">{paymentLabel(paymentTerms)}</span></span>
        <span className="font-heading text-base font-bold text-accent whitespace-nowrap">Total: {fmt(total)}</span>
      </div>
    </div>
  );
}
