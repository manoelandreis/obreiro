import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  default_price: number | null;
  category: string | null;
  is_active: boolean | null;
}

const emptyTemplate = { name: '', description: '', unit: 'un', default_price: 0, category: '' };

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState(emptyTemplate);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    supabase.from('quote_templates').select('*').order('name').then(({ data }) => {
      if (data) setTemplates(data as Template[]);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name) { toast.error('Nome é obrigatório.'); return; }
    if (editId) {
      await supabase.from('quote_templates').update({ ...form, default_price: Number(form.default_price) }).eq('id', editId);
      toast.success('Template atualizado.');
    } else {
      await supabase.from('quote_templates').insert({ ...form, default_price: Number(form.default_price) });
      toast.success('Template criado.');
    }
    setOpen(false);
    setForm(emptyTemplate);
    setEditId(null);
    load();
  };

  const handleEdit = (t: Template) => {
    setForm({ name: t.name, description: t.description || '', unit: t.unit || 'un', default_price: Number(t.default_price) || 0, category: t.category || '' });
    setEditId(t.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('quote_templates').delete().eq('id', id);
    toast.success('Template eliminado.');
    load();
  };

  const fmt = (v: number | null) => (v ?? 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Templates de Orçamento</h1>
          <p className="text-muted-foreground">Serviços e preços pré-definidos para o gerador público.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyTemplate); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Template</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pintura Interior" /></div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Unidade</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
                <div><Label>Preço (€)</Label><Input type="number" value={form.default_price} onChange={(e) => setForm({ ...form, default_price: Number(e.target.value) })} /></div>
                <div><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              </div>
              <Button onClick={handleSave} className="w-full">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.category || '—'}</TableCell>
                  <TableCell>{t.unit}</TableCell>
                  <TableCell>{fmt(t.default_price)}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum template.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
