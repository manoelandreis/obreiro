import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/QuoteStatusBadge';
import { Plus, FileText, Wallet, Coins, Bell, Mail, ArrowRight } from 'lucide-react';
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
}

const fmt = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
const daysUntil = (iso: string) => Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000);

interface Reminder {
  id: string;
  quoteId: string;
  urgency: number; // higher = more urgent
  title: string;
  message: string;
}

export default function AppDashboard() {
  const { user } = useAppAuth();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from('app_quotes')
        .select('id, title, status, total, created_at, sent_at, viewed_at, responded_at, expires_at, payment_terms, client_snapshot')
        .order('created_at', { ascending: false });
      setQuotes((data ?? []) as any);
    })();
  }, [user]);

  const stats = useMemo(() => {
    const now = new Date();
    const openStatuses: QuoteStatus[] = ['rascunho', 'enviado', 'visto'];
    const open = quotes.filter((q) => openStatuses.includes(q.status));
    const accepted = quotes.filter((q) => q.status === 'aceite');

    const acceptedThisMonth = accepted.filter((q) => {
      const ref = q.responded_at ?? q.updated_at_fallback ?? q.created_at;
      return ref && isWithinMonth(new Date(ref), now);
    });
    const acceptedTotalAllTime = accepted.reduce((a, q) => a + Number(q.total || 0), 0);
    const acceptedThisMonthTotal = acceptedThisMonth.reduce((a, q) => a + Number(q.total || 0), 0);

    // A receber este mês: expand installments for accepted quotes, sum those due in current month
    let receivableThisMonth = 0;
    for (const q of accepted) {
      const anchor = q.responded_at ?? q.sent_at ?? q.created_at;
      const parts = expandInstallments(q.payment_terms ?? null, Number(q.total || 0), anchor);
      for (const p of parts) {
        if (isWithinMonth(p.dueDate, now)) receivableThisMonth += p.amount;
      }
    }

    return {
      openCount: open.length,
      acceptedThisMonthTotal,
      acceptedTotalAllTime,
      receivableThisMonth,
    };
  }, [quotes]);

  const recent = quotes.slice(0, 5);

  const reminders = useMemo<Reminder[]>(() => {
    const out: Reminder[] = [];
    for (const q of quotes) {
      const clientName = q.client_snapshot?.name ?? 'Cliente';
      if (q.status === 'enviado' && q.sent_at) {
        const d = daysSince(q.sent_at);
        if (d >= 7 && d <= 60) {
          out.push({
            id: `sent-${q.id}`,
            quoteId: q.id,
            urgency: 50 + d,
            title: `«${q.title}» sem resposta há ${d} dias`,
            message: `Enviado a ${clientName} — envie uma mensagem de seguimento.`,
          });
        }
      }
      if (q.status === 'visto' && q.viewed_at) {
        const d = daysSince(q.viewed_at);
        if (d >= 3) {
          out.push({
            id: `viewed-${q.id}`,
            quoteId: q.id,
            urgency: 80 + d,
            title: `${clientName} abriu «${q.title}» há ${d} dias`,
            message: 'Faça follow-up enquanto está fresco na cabeça do cliente.',
          });
        }
      }
      if (q.status === 'aceite' && q.responded_at) {
        const d = daysSince(q.responded_at);
        if (d >= 7) {
          out.push({
            id: `accepted-${q.id}`,
            quoteId: q.id,
            urgency: 40,
            title: `«${q.title}» foi aceite há ${d} dias`,
            message: 'Confirme datas com o cliente e inicie o trabalho.',
          });
        }
      }
      if (q.expires_at && !['aceite', 'rejeitado', 'expirado'].includes(q.status)) {
        const left = daysUntil(q.expires_at);
        if (left >= 0 && left <= 5) {
          out.push({
            id: `exp-${q.id}`,
            quoteId: q.id,
            urgency: 100 - left,
            title: `«${q.title}» expira em ${left} dia${left === 1 ? '' : 's'}`,
            message: `Avise ${clientName} antes que expire.`,
          });
        }
      }
    }
    return out.sort((a, b) => b.urgency - a.urgency).slice(0, 6);
  }, [quotes]);

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral dos seus orçamentos e do dinheiro a entrar.</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/app/quotes/new"><Plus className="h-4 w-4" /> Novo Orçamento</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={FileText}
          label="Orçamentos em aberto"
          value={String(stats.openCount)}
          accent="text-primary"
          bg="bg-primary/10"
        />
        <StatCard
          icon={Wallet}
          label="Aprovado este mês"
          value={fmt(stats.acceptedThisMonthTotal)}
          accent="text-success-soft-foreground"
          bg="bg-success-soft"
          footnote={`Acumulado: ${fmt(stats.acceptedTotalAllTime)}`}
        />
        <StatCard
          icon={Coins}
          label="A receber este mês"
          value={fmt(stats.receivableThisMonth)}
          accent="text-accent"
          bg="bg-accent/10"
          footnote="Baseado nos formatos de pagamento"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold">Orçamentos Recentes</h2>
              <Link to="/app/quotes" className="text-sm text-primary font-medium hover:underline">Ver todos</Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Ainda sem orçamentos. <Link to="/app/quotes/new" className="text-primary hover:underline">Crie o primeiro</Link>.
              </p>
            ) : (
              <div className="space-y-1">
                {recent.map((q) => (
                  <Link
                    key={q.id}
                    to={`/app/quotes/${q.id}`}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-3 hover:bg-muted/40 rounded px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm uppercase">
                        {q.title?.[0] ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{q.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {q.client_snapshot?.name ?? '—'} • {new Date(q.created_at).toLocaleDateString('pt-PT')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-primary">{fmt(Number(q.total || 0))}</span>
                      <StatusBadge status={q.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-accent" /> Lembretes
              </h2>
              <span className="text-xs text-muted-foreground">{reminders.length} ações</span>
            </div>
            {reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Tudo em dia. Sem follow-ups pendentes.
              </p>
            ) : (
              <ul className="space-y-3">
                {reminders.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{r.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.message}</div>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                      <Link to={`/app/quotes/${r.quoteId}`}>
                        Abrir <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, bg, footnote }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
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
