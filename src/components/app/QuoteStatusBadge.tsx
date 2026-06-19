import { cn } from '@/lib/utils';

type Status = 'rascunho' | 'enviado' | 'visto' | 'aceite' | 'rejeitado' | 'expirado';

const DrawIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...props}>
    <path d="M1.5 11.15v-2.26L9.18 1.21a1.1 1.1 0 0 1 1.62 0l.65.61a1.13 1.13 0 0 1 0 1.64L3.77 11.15H1.5Zm8.12-7.5 1-1-.6-.6-1 1 .6.6Z" fill="currentColor"/>
  </svg>
);
const ScheduleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...props}>
    <path d="M7.87 8.58 8.82 7.64 6.66 5.49V2.47H5.34v3.58l2.53 2.53ZM6 12a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z" fill="currentColor"/>
  </svg>
);
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...props}>
    <path d="M5.22 8.31 8.88 4.66l-.98-.99-2.68 2.67-1.16-1.15-.99.99 2.15 2.13ZM6 12a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z" fill="currentColor"/>
  </svg>
);
const CancelIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...props}>
    <path d="M3.99 8.86 6 6.85l2.01 2.01.85-.85L6.85 6l2.01-2.01-.85-.85L6 5.15 3.99 3.14l-.85.85L5.15 6 3.14 8.01l.85.85ZM6 12a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z" fill="currentColor"/>
  </svg>
);
const ErrorIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...props}>
    <path d="M6.55 8.92a.78.78 0 1 0-1.11-1.11.77.77 0 0 0 0 1.11.77.77 0 0 0 1.11 0ZM5.27 6.73h1.46V2.97H5.27v3.76ZM6 12a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z" fill="currentColor"/>
  </svg>
);

const STYLES: Record<Status, { label: string; cls: string; Icon: React.FC<any> }> = {
  rascunho: { label: 'Rascunho', cls: 'bg-muted text-muted-foreground', Icon: DrawIcon },
  enviado: { label: 'Enviado', cls: 'bg-info-soft text-info-soft-foreground', Icon: ScheduleIcon },
  visto: { label: 'Visto', cls: 'bg-info-soft text-info-soft-foreground', Icon: ScheduleIcon },
  aceite: { label: 'Orçamento aceito', cls: 'bg-success-soft text-success-soft-foreground', Icon: CheckCircleIcon },
  rejeitado: { label: 'Cancelado', cls: 'bg-destructive-soft text-destructive-soft-foreground', Icon: CancelIcon },
  expirado: { label: 'Expirado', cls: 'bg-warning-soft text-warning-soft-foreground', Icon: ErrorIcon },
};

const daysSince = (iso: string | Date) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

function Pill({ cls, Icon, label }: { cls: string; Icon: React.FC<any>; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full text-xs font-medium whitespace-nowrap',
        cls,
      )}
      style={{ paddingTop: 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 10 }}
    >
      <Icon />
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const m = STYLES[status] ?? STYLES.rascunho;
  return <Pill cls={m.cls} Icon={m.Icon} label={m.label} />;
}

/** Smart badge that adds dynamic context (days since viewed, overdue payment). */
export function SmartStatusBadge({
  status,
  viewed_at,
  payment_due_days,
}: {
  status: Status;
  viewed_at?: string | null;
  payment_due_days?: number | null;
}) {
  if (status === 'aceite' && payment_due_days && payment_due_days >= 1) {
    return (
      <Pill
        cls="bg-warning-soft text-warning-soft-foreground"
        Icon={ErrorIcon}
        label={`Pagamento pendente há ${payment_due_days} dias`}
      />
    );
  }
  if (status === 'visto' && viewed_at) {
    const d = daysSince(viewed_at);
    return (
      <Pill
        cls="bg-info-soft text-info-soft-foreground"
        Icon={ScheduleIcon}
        label={`Visto há ${d} ${d === 1 ? 'dia' : 'dias'} sem resposta`}
      />
    );
  }
  return <StatusBadge status={status} />;
}
