import { Star, Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PaymentInstallment, summarizeInstallment } from '@/lib/paymentTerms';

interface PaymentPresetCardProps {
  title: string;
  installments: PaymentInstallment[];
  selected?: boolean;
  saved?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PaymentPresetCard({
  title,
  installments,
  selected,
  saved,
  onClick,
  onEdit,
  onDelete,
}: PaymentPresetCardProps) {
  const total = installments.reduce((a, b) => a + (Number(b.percent) || 0), 0) || 100;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative text-left rounded-2xl border bg-card p-4 transition-all hover:border-foreground/30 hover:shadow-sm',
        selected ? 'border-primary ring-2 ring-primary/40' : 'border-border'
      )}
    >
      {saved && (
        <Badge
          variant="secondary"
          className="absolute -top-2 left-4 bg-primary/10 text-primary border border-primary/20"
        >
          Guardado por si
        </Badge>
      )}

      <div className="flex items-center gap-2 mb-3">
        {saved && <Star className="h-4 w-4 text-primary fill-primary" />}
        <h4 className="font-semibold text-base">{title}</h4>
      </div>

      {/* Segmented bar */}
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted mb-3">
        {installments.map((i, idx) => {
          const w = ((Number(i.percent) || 0) / total) * 100;
          const isFirst = idx === 0;
          const bg = saved
            ? isFirst ? 'bg-primary' : 'bg-primary/40'
            : isFirst ? 'bg-accent' : 'bg-accent/40';
          return (
            <div
              key={idx}
              className={cn(bg, idx > 0 && 'border-l-2 border-card')}
              style={{ width: `${w}%` }}
            />
          );
        })}
      </div>

      <div className="space-y-1">
        {installments.map((i, idx) => (
          <p key={idx} className="text-sm text-muted-foreground">
            {summarizeInstallment(i)}
          </p>
        ))}
      </div>

      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
            </span>
          )}
          {onDelete && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      )}
    </button>
  );
}

interface CreatePresetCardProps {
  onClick: () => void;
  active?: boolean;
}

export function CreatePresetCard({ onClick, active }: CreatePresetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[160px] p-4 transition-all text-muted-foreground hover:text-foreground hover:border-foreground/40',
        active ? 'border-primary text-primary' : 'border-border'
      )}
    >
      <Plus className="h-6 w-6" />
      <span className="font-medium">Criar personalizado</span>
    </button>
  );
}
