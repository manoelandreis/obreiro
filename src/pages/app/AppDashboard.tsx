import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/app/QuoteStatusBadge';
import { MobilePrimaryAction } from '@/components/app/MobilePrimaryAction';
import { Plus, FileText, Wallet, Coins, Bell, Mail, Receipt, Share2 } from 'lucide-react';
import { expandInstallments, isWithinMonth, type PaymentTerms } from '@/lib/paymentTerms';

type QuoteStatus = 'rascunho' | 'enviado' | 'visto' | 'aceite' | 'rejeitado' | 'expirado';

interface QuoteRow {
  id: string;
  title: string;
  status: QuoteStatus;
  total: number;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  expires_at: string | null;
  payment_terms: PaymentTerms | null;
  client_snapshot: any;
  public_token: string | null;
}

const fmt = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
const daysSince = (iso: string | Date) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

type NotifKind = 'approval' | 'payment';
interface Notif {
  id: string;
  kind: NotifKind;
  quoteId: string;
  publicToken: string | null;
  quoteTitle: string;
  urgency: number;
  title: string;
  subtitle: string;
}

export default function AppDashboard() {
  const { user } = useAppAuth();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from('app_quotes')
        .select(
          'id, title, status, total, created_at, sent_at, viewed_at, responded_at, expires_at, payment_terms, client_snapshot, public_token',
        )
        .order('created_at', { ascending: false });
      setQuotes((data ?? []) as any);
    })();
  }, [user]);

  const stats = useMemo(() => {
    const now = new Date();
    const accepted = quotes.filter((q) => q.status === 'aceite');

    const acceptedThisMonth = accepted.filter((q) => {
      const ref = q.responded_at ?? q.created_at;
      return ref && isWithinMonth(new Date(ref), now);
    });
    const acceptedThisMonthTotal = acceptedThisMonth.reduce((a, q) => a + Number(q.total || 0), 0);

    let receivableThisMonth = 0;
    for (const q of accepted) {
      const anchor = q.responded_at ?? q.sent_at ?? q.created_at;
      const parts = expandInstallments(q.payment_terms ?? null, Number(q.total || 0), anchor);
      for (const p of parts) {
        if (isWithinMonth(p.dueDate, now)) receivableThisMonth += p.amount;
      }
    }

    const totalAllQuotes = quotes.reduce((a, q) => a + Number(q.total || 0), 0);

    const openStatuses: QuoteStatus[] = ['rascunho', 'enviado', 'visto'];
    const openCount = quotes.filter((q) => openStatuses.includes(q.status)).length;

    return {
      acceptedThisMonthTotal,
      acceptedCountThisMonth: acceptedThisMonth.length,
      receivableThisMonth,
      receivableCount: accepted.filter((q) => {
        const anchor = q.responded_at ?? q.sent_at ?? q.created_at;
        return expandInstallments(q.payment_terms ?? null, Number(q.total || 0), anchor).some((p) =>
          isWithinMonth(p.dueDate, now),
        );
      }).length,
      totalAllQuotes,
      totalCount: quotes.length,
      openCount,
    };
  }, [quotes]);

  const recent = quotes.slice(0, 5);

  const notifications = useMemo<Notif[]>(() => {
    const out: Notif[] = [];
    const today = new Date();
    for (const q of quotes) {
      // Follow-up de aprovação: enviado/visto sem resposta
      if (q.status === 'enviado' && q.sent_at) {
        const d = daysSince(q.sent_at);
        if (d >= 3 && d <= 60) {
          out.push({
            id: `apr-sent-${q.id}`,
            kind: 'approval',
            quoteId: q.id,
            publicToken: q.public_token,
            quoteTitle: q.title,
            urgency: 50 + d,
            title: `«${q.title}» sem resposta há ${d} dias`,
            subtitle: 'Follow-up de aprovação',
          });
        }
      }
      if (q.status === 'visto' && q.viewed_at) {
        const d = daysSince(q.viewed_at);
        if (d >= 2) {
          out.push({
            id: `apr-view-${q.id}`,
            kind: 'approval',
            quoteId: q.id,
            publicToken: q.public_token,
            quoteTitle: q.title,
            urgency: 80 + d,
            title: `«${q.title}» visto há ${d} dias sem resposta`,
            subtitle: 'Follow-up de aprovação',
          });
        }
      }
      // Follow-up de pagamento: prestações vencidas
      if (q.status === 'aceite') {
        const anchor = q.responded_at ?? q.sent_at ?? q.created_at;
        const parts = expandInstallments(q.payment_terms ?? null, Number(q.total || 0), anchor);
        for (const p of parts) {
          const d = daysSince(p.dueDate);
          if (d >= 1) {
            out.push({
              id: `pay-${q.id}-${p.label}`,
              kind: 'payment',
              quoteId: q.id,
              publicToken: q.public_token,
              quoteTitle: q.title,
              urgency: 200 + d,
              title: `Pagamento de «${q.title}» pendente há ${d} dias`,
              subtitle: 'Follow-up de pagamento',
            });
            break;
          }
        }
      }
    }
    return out.sort((a, b) => b.urgency - a.urgency).slice(0, 8);
  }, [quotes]);

  const handleShare = async (n: Notif) => {
    if (!n.publicToken) {
      toast.error('Este orçamento ainda não tem link público.');
      return;
    }
    const url = `${window.location.origin}/q/${n.publicToken}`;
    const shareData = { title: n.quoteTitle, text: `Orçamento: ${n.quoteTitle}`, url };
    try {
      if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      /* fallback */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral dos seus orçamentos e do dinheiro a entrar.
          </p>
        </div>
        <MobilePrimaryAction label="Novo Orçamento" to="/app/quotes/new" />
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
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent" /> Notificações
            </h2>
            {notifications.length > 0 && (
              <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/10">
                {notifications.length} {notifications.length === 1 ? 'ação' : 'ações'}
              </Badge>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Tudo em dia. Sem follow-ups pendentes.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const Icon = n.kind === 'payment' ? Receipt : Mail;
                return (
                  <li
                    key={n.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{n.title}</div>
                      <div className="text-xs text-muted-foreground">{n.subtitle}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare(n)}
                        className="gap-1.5"
                        disabled={!n.publicToken}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Partilhar</span>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/app/quotes/${n.quoteId}`}>Abrir</Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold">Orçamentos recentes</h2>
              {stats.openCount > 0 && (
                <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/10">
                  {stats.openCount} em aberto
                </Badge>
              )}
            </div>
            <Link to="/app/quotes" className="text-sm text-accent font-medium hover:underline">
              Ver todos
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Ainda sem orçamentos.{' '}
              <Link to="/app/quotes/new" className="text-primary hover:underline">
                Crie o primeiro
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((q) => (
                <li key={q.id}>
                  <Link
                    to={`/app/quotes/${q.id}`}
                    className="flex items-center justify-between py-3 gap-3 hover:bg-muted/40 rounded px-2 -mx-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{q.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {new Date(q.created_at).toLocaleDateString('pt-PT')}
                        {q.client_snapshot?.name ? ` · ${q.client_snapshot.name}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold">{fmt(Number(q.total || 0))}</span>
                      <StatusBadge status={q.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
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
            {footnote && <div className="text-xs text-muted-foreground mt-1">{footnote}</div>}
          </div>
          <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${accent}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
