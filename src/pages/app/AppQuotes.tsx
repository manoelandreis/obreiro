import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  FileText,
  Share2,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  CircleDot,
  Wallet,
  Coins,
  Check,
} from 'lucide-react';
import { SmartStatusBadge } from '@/components/app/QuoteStatusBadge';
import { MobilePrimaryAction } from '@/components/app/MobilePrimaryAction';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import {
  expandInstallments,
  isWithinMonth,
  type PaymentTerms,
} from '@/lib/paymentTerms';


type Status = 'rascunho' | 'enviado' | 'visto' | 'aceite' | 'rejeitado' | 'expirado';

interface QuoteRow {
  id: string;
  title: string;
  total: number;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  status: Status;
  client_id: string | null;
  public_token: string | null;
  services: any;
  payment_terms: PaymentTerms | null;
  client_snapshot: any;
  app_clients?: { name: string } | null;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'visto', label: 'Visto' },
  { value: 'aceite', label: 'Aceite' },
  { value: 'rejeitado', label: 'Cancelado' },
  { value: 'expirado', label: 'Expirado' },
];

const fmt = (v: number) =>
  v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

const daysSince = (iso: string | Date) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

export default function AppQuotes() {
  const { user } = useAppAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<{ quote: QuoteRow; kind: 'actions' | 'share' } | null>(null);


  const load = async () => {
    const { data } = await supabase
      .from('app_quotes')
      .select(
        'id, title, total, created_at, sent_at, viewed_at, responded_at, status, client_id, public_token, services, payment_terms, client_snapshot, app_clients(name)',
      )
      .order('created_at', { ascending: false });
    if (data) setQuotes(data as any);
  };
  useEffect(() => {
    if (user) void load();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este orçamento?')) return;
    const { error } = await supabase.from('app_quotes').delete().eq('id', id);
    if (error) return toast.error('Erro a eliminar.');
    toast.success('Eliminado.');
    void load();
  };

  const updateStatus = async (q: QuoteRow, status: Status) => {
    if (q.status === status) return;
    const patch: any = { status };
    if (status === 'enviado' && !q.sent_at) patch.sent_at = new Date().toISOString();
    if (status === 'visto' && !q.viewed_at) patch.viewed_at = new Date().toISOString();
    if ((status === 'aceite' || status === 'rejeitado') && !q.responded_at)
      patch.responded_at = new Date().toISOString();
    const { error } = await supabase.from('app_quotes').update(patch).eq('id', q.id);
    if (error) return toast.error('Erro a atualizar.');
    if (user) {
      await supabase.from('quote_status_history').insert({
        quote_id: q.id,
        user_id: user.id,
        status,
        source: 'manual',
      });
    }
    toast.success('Estado atualizado.');
    void load();
  };

  const copyLink = async (q: QuoteRow) => {
    if (!q.public_token) return toast.error('Sem link público.');
    const url = `${window.location.origin}/q/${q.public_token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado.');
    } catch {
      toast.error('Não foi possível copiar.');
    }
  };

  const shareWhatsapp = (q: QuoteRow) => {
    if (!q.public_token) return toast.error('Sem link público.');
    const url = `${window.location.origin}/q/${q.public_token}`;
    const text = encodeURIComponent(`Olá! Aqui está o orçamento «${q.title}»: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareEmail = (q: QuoteRow) => {
    if (!q.public_token) return toast.error('Sem link público.');
    const url = `${window.location.origin}/q/${q.public_token}`;
    const subject = encodeURIComponent(`Orçamento: ${q.title}`);
    const body = encodeURIComponent(`Olá,\n\nSegue o orçamento «${q.title}»:\n${url}\n\nObrigado!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const stats = useMemo(() => {
    const now = new Date();
    const accepted = quotes.filter((q) => q.status === 'aceite');
    const acceptedThisMonth = accepted.filter((q) => {
      const ref = q.responded_at ?? q.created_at;
      return ref && isWithinMonth(new Date(ref), now);
    });
    let receivableThisMonth = 0;
    let receivableCount = 0;
    for (const q of accepted) {
      const anchor = q.responded_at ?? q.sent_at ?? q.created_at;
      const parts = expandInstallments(
        q.payment_terms ?? null,
        Number(q.total || 0),
        anchor,
      );
      let any = false;
      for (const p of parts) {
        if (isWithinMonth(p.dueDate, now)) {
          receivableThisMonth += p.amount;
          any = true;
        }
      }
      if (any) receivableCount++;
    }
    return {
      acceptedThisMonthTotal: acceptedThisMonth.reduce((a, q) => a + Number(q.total || 0), 0),
      acceptedCountThisMonth: acceptedThisMonth.length,
      receivableThisMonth,
      receivableCount,
      totalAllQuotes: quotes.reduce((a, q) => a + Number(q.total || 0), 0),
      totalCount: quotes.length,
    };
  }, [quotes]);

  // Compute payment-due days for an accepted quote (oldest overdue installment)
  const paymentDueDays = (q: QuoteRow): number | null => {
    if (q.status !== 'aceite') return null;
    const anchor = q.responded_at ?? q.sent_at ?? q.created_at;
    const parts = expandInstallments(q.payment_terms ?? null, Number(q.total || 0), anchor);
    let max = 0;
    for (const p of parts) {
      const d = daysSince(p.dueDate);
      if (d >= 1 && d > max) max = d;
    }
    return max || null;
  };

  const filtered = quotes.filter((q) =>
    [q.title, q.app_clients?.name, q.client_snapshot?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">Crie e gerencie os seus orçamentos.</p>
        </div>
        <MobilePrimaryAction
          label="Novo Orçamento"
          onClick={() => navigate('/app/quotes/new')}
          to="/app/quotes/new"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Wallet}
          label="Aprovado este mês"
          value={fmt(stats.acceptedThisMonthTotal)}
          accent="text-success-soft-foreground"
          bg="bg-success-soft"
          footnote={
            stats.acceptedCountThisMonth > 0
              ? `↗ ${stats.acceptedCountThisMonth} ${stats.acceptedCountThisMonth === 1 ? 'orçamento aceite' : 'orçamentos aceites'}`
              : 'Sem orçamentos aceites este mês'
          }
        />
        <StatCard
          icon={Coins}
          label="A receber este mês"
          value={fmt(stats.receivableThisMonth)}
          accent="text-accent"
          bg="bg-accent/10"
          footnote={
            stats.receivableCount > 0
              ? `${stats.receivableCount} ${stats.receivableCount === 1 ? 'pagamento pendente' : 'pagamentos pendentes'}`
              : 'Sem pagamentos previstos'
          }
        />
        <StatCard
          icon={FileText}
          label="Total em orçamentos"
          value={fmt(stats.totalAllQuotes)}
          accent="text-primary"
          bg="bg-primary/10"
          footnote={`acumulado · ${stats.totalCount} ${stats.totalCount === 1 ? 'orçamento' : 'orçamentos'}`}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por orçamentos"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Sem orçamentos. Crie o primeiro.</p>
              <Link to="/app/quotes/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Novo Orçamento
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((q) => {
                const itemsCount = Array.isArray(q.services) ? q.services.length : 0;
                const clientName = q.app_clients?.name ?? q.client_snapshot?.name ?? null;
                const dueDays = paymentDueDays(q);
                return (
                  <div
                    key={q.id}
                    className="py-4 flex items-center gap-4 flex-wrap cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded"
                    onClick={() => navigate(`/app/quotes/${q.id}`)}
                  >
                    <div className="flex-1 min-w-[220px]">
                      <div className="font-semibold flex items-center gap-2 flex-wrap">
                        <span>{q.title}</span>
                        <SmartStatusBadge
                          status={q.status}
                          viewed_at={q.viewed_at}
                          payment_due_days={dueDays}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(q.created_at).toLocaleDateString('pt-PT')}
                        {clientName ? ` · ${clientName}` : ''}
                      </div>
                    </div>

                    <div className="font-bold text-foreground tabular-nums">
                      {fmt(Number(q.total))}
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <MoreHorizontal className="h-4 w-4" /> Ações
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => navigate(`/app/quotes/${q.id}`)}>
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                            <CircleDot className="h-3.5 w-3.5" /> Mudar estado
                          </DropdownMenuLabel>
                          {STATUS_OPTIONS.map((s) => (
                            <DropdownMenuItem
                              key={s.value}
                              onClick={() => updateStatus(q, s.value)}
                            >
                              <span className="flex-1">{s.label}</span>
                              {q.status === s.value && <Check className="h-3.5 w-3.5" />}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(q.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" className="gap-2">
                            <Share2 className="h-4 w-4" /> Partilhar
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => shareEmail(q)}>
                            <Mail className="h-4 w-4 mr-2" /> Enviar por email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareWhatsapp(q)}>
                            <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => copyLink(q)}>
                            Copiar link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, bg, footnote }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              {label}
            </div>
            <div className="mt-3 text-3xl font-bold truncate">{value}</div>
            {footnote && (
              <div className="text-xs text-muted-foreground mt-1">{footnote}</div>
            )}
          </div>
          <div
            className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}
          >
            <Icon className={`h-5 w-5 ${accent}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
