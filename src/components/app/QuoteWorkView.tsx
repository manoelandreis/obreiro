import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Pencil, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MaterialItem { name: string; quantity: number; unit?: string; unitPrice: number }
interface ServiceItem {
  name: string;
  description?: string;
  pricePerHour: number;
  hours: number;
  materials: MaterialItem[];
}

interface Props {
  quoteId: string;
  services: ServiceItem[];
  client: { name?: string; email?: string; phone?: string };
  subtotal: number;
  iva: number;
  notes?: string | null;
  onClientUpdated?: () => void;
}

const euro = (v: number) =>
  Number(v || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

const initialsOf = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
};

export function QuoteWorkView({
  quoteId, services, client, subtotal, iva, notes, onClientUpdated,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: client.name ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
  });
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setForm({ name: client.name ?? '', email: client.email ?? '', phone: client.phone ?? '' });
    setEditOpen(true);
  };

  const saveClient = async () => {
    setSaving(true);
    const { data: q } = await supabase
      .from('app_quotes')
      .select('client_snapshot')
      .eq('id', quoteId)
      .maybeSingle();
    const next = { ...(q?.client_snapshot as any || {}), ...form };
    const { error } = await supabase
      .from('app_quotes')
      .update({ client_snapshot: next })
      .eq('id', quoteId);
    setSaving(false);
    if (error) return toast.error('Não foi possível guardar.');
    toast.success('Cliente atualizado.');
    setEditOpen(false);
    onClientUpdated?.();
  };

  return (
    <div className="space-y-4">
      {/* Client card */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initialsOf(client.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate">{client.name || 'Cliente sem nome'}</div>
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5">
              {client.email && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </span>
              )}
              {client.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {client.phone}
                </span>
              )}
              {!client.email && !client.phone && (
                <span className="italic">Sem contactos</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={openEdit} aria-label="Editar cliente">
            <Pencil className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Services */}
      {services.map((s, idx) => {
        const labor = (s.pricePerHour || 0) * (s.hours || 0);
        const matsTotal = (s.materials || []).reduce(
          (a, m) => a + (m.quantity || 0) * (m.unitPrice || 0), 0,
        );
        const serviceTotal = labor + matsTotal;
        return (
          <Card key={idx}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Serviço {idx + 1}
                  </div>
                  <div className="font-semibold text-base">
                    {s.name || `Serviço ${idx + 1}`}
                  </div>
                  {s.description && (
                    <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {s.description}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Total
                  </div>
                  <div className="font-heading text-lg font-bold text-primary">
                    {euro(serviceTotal)}
                  </div>
                </div>
              </div>

              {(s.hours > 0 || s.pricePerHour > 0) && (
                <div className="text-sm rounded-md bg-muted/40 px-3 py-2">
                  <span className="text-muted-foreground">Mão de obra </span>
                  <span className="font-medium">{euro(s.pricePerHour)}/h</span>
                  <span className="text-muted-foreground"> × </span>
                  <span className="font-medium">{s.hours}h</span>
                  <span className="text-muted-foreground"> = </span>
                  <span className="font-semibold">{euro(labor)}</span>
                </div>
              )}

              {s.materials?.length > 0 && (
                <ul className="divide-y divide-border/60 text-sm">
                  {s.materials.map((m, i) => (
                    <li key={i} className="py-2 flex items-baseline gap-2">
                      <span className="font-medium truncate">{m.name || 'Material'}</span>
                      <span className="text-muted-foreground text-xs">
                        · {m.quantity}{m.unit ? ` ${m.unit}` : ''} × {euro(m.unitPrice)}
                      </span>
                      <span className="ml-auto font-semibold shrink-0">
                        {euro((m.quantity || 0) * (m.unitPrice || 0))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Summary card (no big total here — that lives in the floating bar) */}
      <Card>
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{euro(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">IVA (23%)</span>
            <span className="font-medium">{euro(iva)}</span>
          </div>
        </CardContent>
      </Card>

      {notes && (
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Notas
            </div>
            <div className="text-sm whitespace-pre-wrap">{notes}</div>
          </CardContent>
        </Card>
      )}

      {/* Edit client dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveClient} disabled={saving}>
              {saving ? 'A guardar…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
