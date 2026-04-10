import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, FileText, TrendingUp } from 'lucide-react';

export default function AdminAnalytics() {
  const [leadsCount, setLeadsCount] = useState(0);
  const [quotesCount, setQuotesCount] = useState(0);
  const [chartData, setChartData] = useState<{ date: string; leads: number; quotes: number }[]>([]);

  useEffect(() => {
    // Counts
    supabase.from('waitlist_leads').select('id', { count: 'exact', head: true }).then(({ count }) => setLeadsCount(count ?? 0));
    supabase.from('quote_logs').select('id', { count: 'exact', head: true }).then(({ count }) => setQuotesCount(count ?? 0));

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

    loadChart();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Visão geral dos últimos 14 dias.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
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
              <p className="text-sm text-muted-foreground">Orçamentos Gerados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{leadsCount > 0 ? ((quotesCount / leadsCount) * 100).toFixed(0) : 0}%</p>
              <p className="text-sm text-muted-foreground">Conversão</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
