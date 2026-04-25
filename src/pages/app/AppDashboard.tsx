import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CheckSquare, Calendar, Plus, TrendingUp } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  orcamento: 'Orçamento',
  aprovado: 'Aprovado',
  em_curso: 'Em curso',
  concluido: 'Concluído',
};
const STATUS_STYLES: Record<string, string> = {
  orcamento: 'bg-primary/10 text-primary border-primary/20',
  aprovado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  em_curso: 'bg-amber-50 text-amber-700 border-amber-200',
  concluido: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function AppDashboard() {
  const { user } = useAppAuth();
  const [activeJobs, setActiveJobs] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [weekEvents, setWeekEvents] = useState(0);
  const [recent, setRecent] = useState<any[]>([]);
  const [activity, setActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: jobs }, { count: tasks }] = await Promise.all([
        supabase.from('app_jobs').select('id, title, status, start_date, created_at').order('created_at', { ascending: false }),
        supabase.from('app_job_tasks').select('id', { count: 'exact', head: true }).eq('done', false),
      ]);
      const all = jobs ?? [];
      const active = all.filter((j) => j.status !== 'concluido').length;
      setActiveJobs(active);
      setPendingTasks(tasks ?? 0);

      // Week: jobs starting in next 7 days
      const today = new Date();
      const in7 = new Date();
      in7.setDate(today.getDate() + 7);
      const upcoming = all.filter((j) => j.start_date && new Date(j.start_date) >= today && new Date(j.start_date) <= in7);
      setWeekEvents(upcoming.length);

      setRecent(all.slice(0, 5));

      // Activity: jobs created in last 7 days, by weekday (Mon..Sun)
      const counts = [0, 0, 0, 0, 0, 0, 0];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      all.forEach((j) => {
        const d = new Date(j.created_at);
        if (d >= cutoff) {
          const idx = (d.getDay() + 6) % 7; // Monday = 0
          counts[idx]++;
        }
      });
      setActivity(counts);
    };
    void load();
  }, [user]);

  const max = Math.max(...activity, 1);
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio e tarefas para hoje.</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/app/jobs?new=1"><Plus className="h-4 w-4" /> Novo Trabalho</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Briefcase} label="Trabalhos ativos" value={activeJobs} accent="text-primary" bg="bg-primary/10" />
        <StatCard icon={CheckSquare} label="Tarefas pendentes" value={pendingTasks} accent="text-amber-600" bg="bg-amber-50" suffix="para hoje" />
        <StatCard icon={Calendar} label="Próximos eventos" value={weekEvents} accent="text-violet-600" bg="bg-violet-50" suffix="esta semana" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold">Trabalhos Recentes</h2>
              <Link to="/app/jobs" className="text-sm text-primary font-medium hover:underline">Ver todos</Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Ainda sem trabalhos. <Link to="/app/jobs?new=1" className="text-primary hover:underline">Crie o primeiro</Link>.</p>
            ) : (
              <div className="space-y-2">
                {recent.map((j) => (
                  <div key={j.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm uppercase">
                        {j.title?.[0] ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{j.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {j.start_date ? new Date(j.start_date).toLocaleDateString('pt-PT') : '—'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={STATUS_STYLES[j.status]}>{STATUS_LABELS[j.status]}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="font-heading text-lg font-bold">Atividade Semanal</h2>
            <p className="text-sm text-muted-foreground mb-6">Volume de trabalhos nos últimos 7 dias</p>
            <div className="flex items-end justify-between h-48 gap-2">
              {activity.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-primary rounded-t-lg transition-all"
                    style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? '8px' : '2px', opacity: v > 0 ? 1 : 0.15 }}
                  />
                  <span className="text-xs text-muted-foreground">{days[i]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, bg, suffix }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold">{value}</span>
              {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
            </div>
          </div>
          <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${accent}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
