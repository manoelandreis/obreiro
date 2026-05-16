import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Download, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type LeadStatus = 'novo' | 'contactado' | 'qualificado' | 'convertido' | 'perdido';

interface Lead {
  id: string;
  name: string | null;
  email: string;
  source: string | null;
  created_at: string;
  status: LeadStatus;
  tags: string[] | null;
  notes: string | null;
}

const STATUSES: LeadStatus[] = ['novo', 'contactado', 'qualificado', 'convertido', 'perdido'];

const statusColor: Record<LeadStatus, string> = {
  novo: 'secondary',
  contactado: 'default',
  qualificado: 'default',
  convertido: 'default',
  perdido: 'outline',
};

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editing, setEditing] = useState<Lead | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [statusInput, setStatusInput] = useState<LeadStatus>('novo');

  const load = async () => {
    const { data, error } = await supabase
      .from('waitlist_leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { toast.error(error.message); return; }
    setLeads((data as any) || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = leads.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return l.email.toLowerCase().includes(s) ||
           (l.name || '').toLowerCase().includes(s) ||
           (l.tags || []).some(t => t.toLowerCase().includes(s));
  });

  const openEdit = (l: Lead) => {
    setEditing(l);
    setTagsInput((l.tags || []).join(', '));
    setNotesInput(l.notes || '');
    setStatusInput(l.status);
  };

  const save = async () => {
    if (!editing) return;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const { error } = await supabase
      .from('waitlist_leads')
      .update({ status: statusInput, tags, notes: notesInput || null })
      .eq('id', editing.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Lead atualizada');
    setEditing(null);
    load();
  };

  const updateStatus = async (id: string, status: LeadStatus) => {
    const { error } = await supabase.from('waitlist_leads').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const remove = async (id: string) => {
    if (!confirm('Eliminar este lead?')) return;
    const { error } = await supabase.from('waitlist_leads').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Lead eliminada');
    load();
  };

  const exportCSV = () => {
    const sanitize = (v: any) => {
      const s = String(v ?? '');
      const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows = ['Name,Email,Source,Status,Tags,Notes,Date'];
    filtered.forEach(l => {
      rows.push([l.name || '', l.email, l.source || '', l.status, (l.tags || []).join('|'), l.notes || '', new Date(l.created_at).toLocaleDateString('pt-PT')].map(sanitize).join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Leads & Waitlist</h1>
          <p className="text-muted-foreground">{filtered.length} de {leads.length} leads</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2"><Download className="h-4 w-4" /> Exportar CSV</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar email, nome ou tag..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos estados</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="font-medium">{l.email}</div>
                    {l.name && <div className="text-xs text-muted-foreground">{l.name}</div>}
                  </TableCell>
                  <TableCell>
                    <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v as LeadStatus)}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(l.tags || []).map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(l.created_at).toLocaleDateString('pt-PT')}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma lead</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar lead</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">{editing.email}</div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <Select value={statusInput} onValueChange={(v) => setStatusInput(v as LeadStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tags (separadas por vírgula)</label>
                <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="ex: pintor, lisboa, prioritario" />
              </div>
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Textarea value={notesInput} onChange={e => setNotesInput(e.target.value)} rows={4} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
