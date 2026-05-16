import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Settings2 } from 'lucide-react';

interface AdminUser {
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  tier: 'free' | 'pro' | 'business';
  sub_status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  quotes_count: number;
  quotes_accepted: number;
  last_quote_at: string | null;
}

const TIERS = ['free', 'pro', 'business'] as const;
const STATUSES = ['active', 'trialing', 'past_due', 'canceled', 'incomplete'] as const;

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [newTier, setNewTier] = useState<string>('free');
  const [newStatus, setNewStatus] = useState<string>('active');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.rpc('admin_list_users');
    if (error) { toast.error(error.message); return; }
    setUsers((data as any) || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    if (tierFilter !== 'all' && u.tier !== tierFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.email || '').toLowerCase().includes(s) || (u.display_name || '').toLowerCase().includes(s);
  });

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setNewTier(u.tier);
    setNewStatus(u.sub_status);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.rpc('admin_update_subscription', {
      _user_id: editing.user_id,
      _tier: newTier as any,
      _status: newStatus as any,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Subscrição atualizada');
    setEditing(null);
    load();
  };

  const tierBadge = (t: string) => {
    const map: Record<string, string> = { free: 'secondary', pro: 'default', business: 'default' };
    return <Badge variant={map[t] as any}>{t}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Utilizadores</h1>
        <p className="text-muted-foreground">{filtered.length} de {users.length} contas</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar por email ou nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tiers</SelectItem>
            {TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Orçamentos</TableHead>
                <TableHead>Registo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.user_id}>
                  <TableCell>
                    <div className="font-medium">{u.email}</div>
                    {u.display_name && <div className="text-xs text-muted-foreground">{u.display_name}</div>}
                  </TableCell>
                  <TableCell>{tierBadge(u.tier)}</TableCell>
                  <TableCell><Badge variant="outline">{u.sub_status}</Badge></TableCell>
                  <TableCell>
                    <span className="font-medium">{u.quotes_count}</span>
                    <span className="text-muted-foreground"> ({u.quotes_accepted} aceites)</span>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(u.created_at).toLocaleDateString('pt-PT')}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Settings2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum utilizador encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar subscrição</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">{editing.email}</div>
              <div>
                <label className="text-sm font-medium">Tier</label>
                <Select value={newTier} onValueChange={setNewTier}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'A guardar...' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
