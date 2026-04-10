import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, FileText, TrendingUp, Download, Target, BarChart3 } from 'lucide-react';

export default function AdminAnalytics() {
  const [leadsCount, setLeadsCount] = useState(0);
  const [quotesCount, setQuotesCount] = useState(0);
  const [downloadsCount, setDownloadsCount] = useState(0);
  const [avgValue, setAvgValue] = useState(0);
  const [chartData, setChartData] = useState<{ date: string; leads: number; quotes: number }[]>([]);
  const [funnelData, setFunnelData] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [topTemplates, setTopTemplates] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    // Counts
    supabase.from('waitlist_leads').select('id', { count: 'exact', head: true }).then(({ count }) => setLeadsCount(count ?? 0));
    supabase.from('quote_logs').select('id', { count: 'exact', head: true }).then(({ count }) => setQuotesCount(count ?? 0));

    // Average value
    supabase.from('quote_logs').select('total_amount').then(({ data }) => {
      if (data && data.length > 0) {
        const sum = data.reduce((acc, r) => acc + (Number(r.total_amount) || 0), 0);
        setAvgValue(sum / data.length);
      }
    });

    // Downloads count
    supabase.from('quote_events').select('id', { count: 'exact', head: true }).eq('event_type', 'download').then(({ count }) => setDownloadsCount(count ?? 0));

    // Chart data - last 14 days
    const loadChart = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const sinceStr = since.toISOString();

      const [leadsRes, quotesRes] = await Promise.all([
        supabase.from('waitlist_leads').select('created_at').gte('created_at', sinceStr),
        supabase.from('quote_logs').select('created_at').gte('created_at', sinceStr),
      ]);

      const days: Record<string, { leads: number; quotes: number }> = {};
      for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const key = d.toISOString().slice(0, 10);
        days[key] = { leads: 0, quotes: 0 };
      }

      leadsRes.data?.forEach((l) => {
        const key = l.created_at.slice(0, 10);
        if (days[key]) days[key].leads++;
      });
      quotesRes.data?.forEach((q) => {
        const key = q.created_at.slice(0, 10);
        if (days[key]) days[key].quotes++;
      });

      setChartData(Object.entries(days).map(([date, v]) => ({ date: date.slice(5), ...v })));
    };

    // Funnel data
    const loadFunnel = async () => {
      const fills = ['hsl(221, 83%, 53%)', 'hsl(221, 83%, 60%)', 'hsl(221, 83%, 67%)', 'hsl(38, 92%, 50%)'];
      const steps = [1, 2, 3, 4];
      const stepNames = ['Step 1: Empresa', 'Step 2: Cliente', 'Step 3: Itens', 'Step 4: Preview'];

      const counts = await Promise.all(
        steps.map((s) =>
          supabase.from('quote_events').select('session_id', { count: 'exact', head: false }).eq('event_type', 'step_reached').eq('step_number', s)
        )
      );

      // Count unique sessions per step
      const funnel = steps.map((s, i) => {
        const sessions = new Set(counts[i].data?.map((r: { session_id: string }) => r.session_id) ?? []);
        return { name: stepNames[i], value: sessions.size, fill: fills[i] };
      });

      setFunnelData(funnel);
    };

    // Top templates
    const loadTopTemplates = async () => {
      const { data } = await supabase.from('quote_events').select('metadata').eq('event_type', 'template_used');
      if (!data) return;

      const counts: Record<string, number> = {};
      data.forEach((row) => {
        const meta = row.metadata as Record<string, string> | null;
        const name = meta?.template_name || 'Desconhecido';
        counts[name] = (counts[name] || 0) + 1;
      });

      const sorted = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopTemplates(sorted);
    };

    loadChart();
    loadFunnel();
    loadTopTemplates();
  }, []);

  const fmt = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Visão geral dos últimos 14 dias.</p>
      </div>

      {/* Summary cards */}
      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{leadsCount}</p>
              <p className="text-sm text-muted-foreground">Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{quotesCount}</p>
              <p className="text-sm text-muted-foreground">Orçamentos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{downloadsCount}</p>
              <p className="text-sm text-muted-foreground">Downloads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{leadsCount > 0 ? ((quotesCount / leadsCount) * 100).toFixed(0) : 0}%</p>
              <p className="text-sm text-muted-foreground">Conversão</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{fmt(avgValue)}</p>
              <p className="text-sm text-muted-foreground">Valor Médio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily activity chart */}
        <Card>
          <CardHeader><CardTitle>Atividade Diária</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="leads" fill="hsl(221, 83%, 53%)" name="Leads" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="quotes" fill="hsl(38, 92%, 50%)" name="Orçamentos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" /> Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.length > 0 && funnelData.some(d => d.value > 0) ? (
              <div className="space-y-3">
                {funnelData.map((step, i) => {
                  const maxVal = Math.max(...funnelData.map(d => d.value), 1);
                  const pct = (step.value / maxVal) * 100;
                  const dropoff = i > 0 && funnelData[i - 1].value > 0
                    ? ((1 - step.value / funnelData[i - 1].value) * 100).toFixed(0)
                    : null;
                  return (
                    <div key={step.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{step.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-bold">{step.value}</span>
                          {dropoff && <span className="text-destructive text-xs">-{dropoff}%</span>}
                        </span>
                      </div>
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: step.fill }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Ainda sem dados de funil. Os dados aparecerão quando os utilizadores começarem a usar o gerador de orçamentos.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top templates */}
      <Card>
        <CardHeader><CardTitle>Templates Mais Usados</CardTitle></CardHeader>
        <CardContent>
          {topTemplates.length > 0 ? (
            <div className="space-y-3">
              {topTemplates.map((t, i) => (
                <div key={t.name} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">{t.name}</span>
                      <span className="text-sm text-muted-foreground">{t.count}×</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(t.count / topTemplates[0].count) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum template usado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
