import { Badge } from '@/components/ui/badge';

type Status = 'rascunho' | 'enviado' | 'visto' | 'aceite' | 'rejeitado' | 'expirado';

const MAP: Record<Status, { label: string; cls: string }> = {
  rascunho: { label: 'Rascunho', cls: 'bg-muted text-muted-foreground' },
  enviado: { label: 'Enviado', cls: 'bg-blue-100 text-blue-800' },
  visto: { label: 'Visto', cls: 'bg-amber-100 text-amber-800' },
  aceite: { label: 'Aceite', cls: 'bg-emerald-100 text-emerald-800' },
  rejeitado: { label: 'Rejeitado', cls: 'bg-red-100 text-red-800' },
  expirado: { label: 'Expirado', cls: 'bg-zinc-200 text-zinc-700' },
};

export function StatusBadge({ status }: { status: Status }) {
  const m = MAP[status] ?? MAP.rascunho;
  return <Badge className={`${m.cls} hover:${m.cls} border-0`}>{m.label}</Badge>;
}
