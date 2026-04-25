import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileText, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteRow {
  id: string;
  title: string;
  total: number;
  created_at: string;
  client_id: string | null;
  app_clients?: { name: string } | null;
}

const fmt = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export default function AppQuotes() {
  const { user } = useAppAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('app_quotes')
      .select('id, title, total, created_at, client_id, app_clients(name)')
      .order('created_at', { ascending: false });
    if (data) setQuotes(data as any);
  };
  useEffect(() => { if (user) void load(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este orçamento?')) return;
    const { error } = await supabase.from('app_quotes').delete().eq('id', id);
    if (error) return toast.error('Erro a eliminar.');
    toast.success('Eliminado.');
    void load();
  };

  const filtered = quotes.filter((q) =>
    [q.title, q.app_clients?.name].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">Crie e gerencie os seus orçamentos.</p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/app/quotes/new')}>
          <Plus className="h-4 w-4" /> Novo Orçamento
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar orçamentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Sem orçamentos. Crie o primeiro.</p>
              <Link to="/app/quotes/new"><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Orçamento</Button></Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((q) => (
                <div key={q.id} className="py-4 flex items-center gap-4 flex-wrap">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-semibold">{q.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1 flex-wrap">
                      {q.app_clients?.name && <span>{q.app_clients.name}</span>}
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(q.created_at).toLocaleDateString('pt-PT')}</span>
                    </div>
                  </div>
                  <div className="font-bold text-primary">{fmt(Number(q.total))}</div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)} className="text-destructive hover:text-destructive hover:bg-destructive/5">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
