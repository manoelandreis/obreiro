import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Calendar, ListChecks, FileText, Briefcase, Trash2, Check, ChevronRight, Package, Zap } from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = [
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'em_curso', label: 'Em curso' },
  { value: 'concluido', label: 'Concluído' },
];
const STATUS_BADGE: Record<string, string> = {
  orcamento: 'bg-primary/10 text-primary border-primary/20',
  aprovado: 'bg-success-soft text-success-soft-foreground border-success/20',
  em_curso: 'bg-warning-soft text-warning-soft-foreground border-warning/20',
  concluido: 'bg-success-soft text-success-soft-foreground border-success/20',
};

interface Job {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  estimated_value: number | null;
  client_id: string | null;
  app_clients?: { name: string } | null;
}

export default function AppJobs() {
  const { user } = useAppAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [params, setParams] = useSearchParams();
  const [openNew, setOpenNew] = useState(params.get('new') === '1');
  const [planJob, setPlanJob] = useState<Job | null>(null);

  const [form, setForm] = useState({ title: '', clientId: '', description: '', start: new Date().toISOString().slice(0, 10), value: '' });

  const load = async () => {
    const { data } = await supabase.from('app_jobs').select('*, app_clients(name)').order('created_at', { ascending: false });
    if (data) setJobs(data as any);
  };
  const loadClients = async () => {
    const { data } = await supabase.from('app_clients').select('id, name').order('name');
    if (data) setClients(data);
  };
  useEffect(() => { if (user) { void load(); void loadClients(); } }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('app_jobs').insert({
      user_id: user.id,
      title: form.title.trim(),
      client_id: form.clientId || null,
      description: form.description.trim() || null,
      start_date: form.start || null,
      estimated_value: form.value ? Number(form.value) : 0,
    });
    if (error) return toast.error('Erro a criar trabalho.');
    toast.success('Trabalho criado.');
    setOpenNew(false);
    setParams({});
    setForm({ title: '', clientId: '', description: '', start: new Date().toISOString().slice(0, 10), value: '' });
    void load();
  };

  const handleStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('app_jobs').update({ status: status as any }).eq('id', id);
    if (error) return toast.error('Erro a atualizar estado.');
    void load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este trabalho e todas as suas tarefas/materiais?')) return;
    const { error } = await supabase.from('app_jobs').delete().eq('id', id);
    if (error) return toast.error('Erro a eliminar.');
    toast.success('Eliminado.');
    void load();
  };

  const filtered = jobs.filter((j) =>
    [j.title, j.app_clients?.name, j.description].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Trabalhos</h1>
          <p className="text-muted-foreground">Gerir orçamentos e serviços em curso.</p>
        </div>
        <Button className="gap-2" onClick={() => setOpenNew(true)}><Plus className="h-4 w-4" /> Novo Trabalho</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar trabalhos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Sem trabalhos. Crie o primeiro.</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((j) => (
                <div key={j.id} className="py-4 flex items-center gap-4 flex-wrap">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold uppercase">
                    {j.title?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{j.title}</span>
                      <Badge variant="outline" className={STATUS_BADGE[j.status]}>{STATUSES.find((s) => s.value === j.status)?.label}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1 flex-wrap">
                      {j.app_clients?.name && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {j.app_clients.name}</span>}
                      {j.start_date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(j.start_date).toLocaleDateString('pt-PT')}</span>}
                      {!!j.estimated_value && <span className="px-2 py-0.5 rounded-md bg-muted text-foreground font-medium text-xs">{Number(j.estimated_value).toFixed(0)}€</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-primary" onClick={() => setPlanJob(j)}>
                    <ListChecks className="h-4 w-4" /> Gerir Tarefas
                  </Button>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Select value={j.status} onValueChange={(v) => handleStatus(j.id, v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(j.id)} className="text-destructive hover:text-destructive hover:bg-destructive/5">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New job dialog */}
      <Dialog open={openNew} onOpenChange={(v) => { setOpenNew(v); if (!v) setParams({}); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Novo Trabalho</DialogTitle>
            <DialogDescription>Preencha os detalhes para criar um novo registo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Título do Trabalho</Label>
              <Input required placeholder="Ex: Pintura Sala" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Cliente</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente..." /></SelectTrigger>
                <SelectContent>
                  {clients.length === 0 && <div className="p-2 text-sm text-muted-foreground">Nenhum cliente. Crie em Clientes.</div>}
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição (Opcional)</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Início</Label>
                <Input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
              </div>
              <div>
                <Label>Valor Est. (€)</Label>
                <Input type="number" step="0.01" placeholder="€" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setOpenNew(false); setParams({}); }}>Cancelar</Button>
              <Button type="submit">Criar Trabalho</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {planJob && <PlanningDialog job={planJob} onClose={() => setPlanJob(null)} userId={user!.id} />}
    </div>
  );
}

// ============= Planning dialog (groups → tasks + materials) =============

interface Group { id: string; name: string; }
interface TaskRow { id: string; description: string; done: boolean; }
interface MaterialRow { id: string; description: string; obtained: boolean; }

function PlanningDialog({ job, onClose, userId }: { job: Job; onClose: () => void; userId: string }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState('');
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newMat, setNewMat] = useState('');

  const loadGroups = async () => {
    const { data } = await supabase.from('app_job_groups').select('*').eq('job_id', job.id).order('sort_order');
    if (data) {
      setGroups(data);
      if (!activeGroup && data.length > 0) setActiveGroup(data[0].id);
    }
  };

  const loadGroupContent = async (gid: string) => {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from('app_job_tasks').select('*').eq('group_id', gid).order('sort_order'),
      supabase.from('app_job_materials').select('*').eq('group_id', gid).order('sort_order'),
    ]);
    setTasks(t ?? []);
    setMaterials(m ?? []);
  };

  useEffect(() => { void loadGroups(); }, [job.id]);
  useEffect(() => { if (activeGroup) void loadGroupContent(activeGroup); }, [activeGroup]);

  const addGroup = async () => {
    if (!newGroup.trim()) return;
    const { data, error } = await supabase.from('app_job_groups').insert({
      user_id: userId, job_id: job.id, name: newGroup.trim(), sort_order: groups.length,
    }).select().single();
    if (error || !data) return toast.error('Erro.');
    setNewGroup('');
    setGroups([...groups, data]);
    setActiveGroup(data.id);
  };

  const deleteGroup = async (id: string) => {
    if (!confirm('Eliminar este grupo e tudo dentro?')) return;
    await supabase.from('app_job_groups').delete().eq('id', id);
    const remaining = groups.filter((g) => g.id !== id);
    setGroups(remaining);
    setActiveGroup(remaining[0]?.id ?? null);
  };

  const addTask = async () => {
    if (!newTask.trim() || !activeGroup) return;
    const { data } = await supabase.from('app_job_tasks').insert({
      user_id: userId, group_id: activeGroup, description: newTask.trim(), sort_order: tasks.length,
    }).select().single();
    if (data) { setTasks([...tasks, data]); setNewTask(''); }
  };
  const toggleTask = async (t: TaskRow) => {
    await supabase.from('app_job_tasks').update({ done: !t.done }).eq('id', t.id);
    setTasks(tasks.map((x) => x.id === t.id ? { ...x, done: !x.done } : x));
  };

  const addMat = async () => {
    if (!newMat.trim() || !activeGroup) return;
    const { data } = await supabase.from('app_job_materials').insert({
      user_id: userId, group_id: activeGroup, description: newMat.trim(), sort_order: materials.length,
    }).select().single();
    if (data) { setMaterials([...materials, data]); setNewMat(''); }
  };
  const toggleMat = async (m: MaterialRow) => {
    await supabase.from('app_job_materials').update({ obtained: !m.obtained }).eq('id', m.id);
    setMaterials(materials.map((x) => x.id === m.id ? { ...x, obtained: !x.obtained } : x));
  };

  const active = groups.find((g) => g.id === activeGroup);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Planeamento: {job.title}</DialogTitle>
          <DialogDescription>Organize passos e materiais para cada etapa do serviço.</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-[260px_1fr] gap-6 min-h-[420px]">
          {/* Groups column */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input placeholder="Nova tarefa... (ex: Preparação)" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGroup())} />
              <Button size="icon" onClick={addGroup}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-1">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setActiveGroup(g.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-2 text-sm transition ${activeGroup === g.id ? 'bg-primary/10 text-primary border border-primary/20 font-semibold' : 'hover:bg-muted'}`}
                >
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  <span className="flex-1 truncate">{g.name}</span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {active ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-xl font-bold">{active.name}</h3>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mt-1">
                    {tasks.length} ATIVIDADES · {materials.length} PRODUTOS
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteGroup(active.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-1.5 text-primary text-xs uppercase tracking-wide font-bold mb-3">
                    <Zap className="h-4 w-4" /> Atividades / Passos
                  </div>
                  <div className="flex gap-2 mb-3">
                    <Input placeholder="Adicionar passo..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())} />
                    <Button size="icon" onClick={addTask}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-1.5">
                    {tasks.map((t) => (
                      <button key={t.id} onClick={() => toggleTask(t)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-left">
                        <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${t.done ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                          {t.done && <Check className="h-3 w-3 text-primary-foreground" />}
                        </span>
                        <span className={`text-sm ${t.done ? 'line-through text-muted-foreground' : ''}`}>{t.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-success text-xs uppercase tracking-wide font-bold mb-3">
                    <Package className="h-4 w-4" /> Produtos / Materiais
                  </div>
                  <div className="flex gap-2 mb-3">
                    <Input placeholder="Adicionar material..." value={newMat} onChange={(e) => setNewMat(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMat())} />
                    <Button size="icon" onClick={addMat}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-1.5">
                    {materials.map((m) => (
                      <button key={m.id} onClick={() => toggleMat(m)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-left">
                        <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${m.obtained ? 'bg-success border-success' : 'border-muted-foreground/40'}`}>
                          {m.obtained && <Check className="h-3 w-3 text-success-foreground" />}
                        </span>
                        <span className={`text-sm ${m.obtained ? 'line-through text-muted-foreground' : ''}`}>{m.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center text-muted-foreground text-sm">
              Crie um grupo de tarefas para começar.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
