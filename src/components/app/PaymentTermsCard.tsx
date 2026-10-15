import { expandInstallments, presetById, type PaymentTerms } from '@/lib/paymentTerms';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

interface Props {
  paymentTerms: PaymentTerms | null | undefined;
  total: number;
  anchor: string | Date | null | undefined;
  className?: string;
  mbway?: string | null;
  iban?: string | null;
}

const euro = (v: number) =>
  Number(v || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export function PaymentTermsCard({ paymentTerms, total, anchor, className, mbway, iban }: Props) {
  if (!paymentTerms) return null;
  const parts = expandInstallments(paymentTerms, total, anchor ?? new Date());
  const presetLabel = presetById(paymentTerms.preset).label;
  const hasPaymentInfo = Boolean(mbway || iban);

  return (
    <Card
      className={
        'border-accent/40 bg-accent/5 ' + (className ?? '')
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
        <div
          className={
            'space-y-1' + (hasPaymentInfo ? ' pb-3 border-b border-dashed border-accent/40' : '')
          }
        >
          {parts.map((p, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_6rem] items-center gap-3 text-sm">
              <span className="truncate">
                {p.label} <span className="text-muted-foreground">({p.percent}%)</span>
              </span>
              <span className="font-semibold text-accent text-right">{euro(p.amount)}</span>
            </div>
          ))}
        </div>
        {hasPaymentInfo && (
          <div className="space-y-2 text-sm">
            {mbway && (
              <div className="flex flex-wrap gap-x-2.5">
                <span>MBWAY:</span>
                <span className="font-medium break-all">{mbway}</span>
              </div>
            )}
            {iban && (
              <div className="flex flex-wrap gap-x-2.5">
                <span>IBAN:</span>
                <span className="font-medium break-all">{iban}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
