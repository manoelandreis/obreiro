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
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {parts.map((p, idx) => (
            <div
              key={idx}
              className="rounded-md border bg-background p-3 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {idx + 1}ª · {p.percent}%
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {p.dueDate.toLocaleDateString('pt-PT')}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{p.label}</div>
              <div className="text-base font-bold text-primary">{euro(p.amount)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
