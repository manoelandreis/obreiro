import { expandInstallments, presetById, type PaymentTerms } from '@/lib/paymentTerms';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

interface Props {
  paymentTerms: PaymentTerms | null | undefined;
  total: number;
  anchor: string | Date | null | undefined;
  className?: string;
}

const euro = (v: number) =>
  Number(v || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export function PaymentTermsCard({ paymentTerms, total, anchor, className }: Props) {
  if (!paymentTerms) return null;
  const parts = expandInstallments(paymentTerms, total, anchor ?? new Date());
  const presetLabel = presetById(paymentTerms.preset).label;

  return (
    <Card
      className={
        'border-accent/40 border-l-4 border-l-accent bg-accent/5 ' + (className ?? '')
      }
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-dashed border-accent/40">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-accent" />
            <span className="text-[11px] uppercase tracking-wide font-bold text-primary">
              Formato de pagamento
            </span>
          </div>
          <span className="text-xs font-semibold text-accent">{presetLabel}</span>
        </div>
        <div className="space-y-1">
          {parts.map((p, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_6rem] items-center gap-3 text-sm">
              <span className="truncate">
                {p.label} <span className="text-muted-foreground">({p.percent}%)</span>
              </span>
              <span className="font-semibold text-accent text-right">{euro(p.amount)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
