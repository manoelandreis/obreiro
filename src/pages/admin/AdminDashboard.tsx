import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Mail, TrendingUp, Crown, Building2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface Kpis {
  users_total: number;
  users_new_30d: number;
  users_new_7d: number;
  subs_free: number;
  subs_pro: number;
  subs_business: number;
  subs_canceled: number;
  mrr_estimate: number;
  quotes_total: number;
  quotes_sent: number;
  quotes_accepted: number;
  quotes_30d: number;
  leads_total: number;
  leads_30d: number;
}

interface Point { day: string; signups: number; quotes: number; leads: number; }

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [series, setSeries] = useState<Point[]>([]);

  useEffect(() => {
    (async () => {
      const { data: k } = await supabase.rpc('admin_dashboard_kpis');
      if (k) setKpis(k as any);
      const { data: ts } = await supabase.rpc('admin_dashboard_timeseries', { _days: 30 });
      if (ts) setSeries((ts as any[]).map(p => ({ ...p, day: new Date(p.day).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) })));
    })();
  }, []);

  const acceptRate = kpis && kpis.quotes_sent > 0 ? Math.round((kpis.quotes_accepted / kpis.quotes_sent) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do negócio</p>
      </div>

      {kpis && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={TrendingUp} label="MRR estimado" value={`${kpis.mrr_estimate}€`} sub={`${kpis.subs_pro + kpis.subs_business} subs pagas`} />
            <Kpi icon={Users} label="Utilizadores" value={kpis.users_total} sub={`+${kpis.users_new_30d} (30d)`} />
            <Kpi icon={FileText} label="Orçamentos enviados" value={kpis.quotes_sent} sub={`${acceptRate}% aceites`} />
            <Kpi icon={Mail} label="Leads (waitlist)" value={kpis.leads_total} sub={`+${kpis.leads_30d} (30d)`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Kpi icon={Users} label="Free" value={kpis.subs_free} />
            <Kpi icon={Crown} label="Pro ativo" value={kpis.subs_pro} />
            <Kpi icon={Building2} label="Business ativo" value={kpis.subs_business} />
          </div>

          <Card>
            <CardHeader><CardTitle>Últimos 30 dias</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="signups" name="Registos" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="quotes" name="Orçamentos" stroke="hsl(var(--accent))" strokeWidth={2} />
                    <Line type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold font-heading mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <Icon className="h-8 w-8 text-primary/40" />
        </div>
      </CardContent>
    </Card>
  );
}
