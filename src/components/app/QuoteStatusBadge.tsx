import { Badge } from '@/components/ui/badge';

type Status = 'rascunho' | 'enviado' | 'visto' | 'aceite' | 'rejeitado' | 'expirado';

const MAP: Record<Status, { label: string; cls: string }> = {
  rascunho: { label: 'Rascunho', cls: 'bg-muted text-muted-foreground' },
  enviado: { label: 'Enviado', cls: 'bg-info-soft text-info-soft-foreground' },
  visto: { label: 'Visto', cls: 'bg-warning-soft text-warning-soft-foreground' },
  aceite: { label: 'Aceite', cls: 'bg-success-soft text-success-soft-foreground' },
  rejeitado: { label: 'Rejeitado', cls: 'bg-destructive-soft text-destructive-soft-foreground' },
  expirado: { label: 'Expirado', cls: 'bg-muted text-muted-foreground' },
};

export function StatusBadge({ status }: { status: Status }) {
  const m = MAP[status] ?? MAP.rascunho;
  return <Badge className={`${m.cls} hover:${m.cls} border-0`}>{m.label}</Badge>;
}
