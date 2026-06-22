import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { toast } from 'sonner';

export interface CreatedClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  rgpd_consent?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string | undefined;
  onCreated?: (client: CreatedClient) => void;
}

export function ClientFormSheet({ open, onOpenChange, userId, onCreated }: Props) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', consent: false });
  const [saving, setSaving] = useState(false);

  const reset = () => setForm({ name: '', email: '', phone: '', address: '', consent: false });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!form.consent) {
      toast.error('Confirme o consentimento RGPD do cliente.');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from('app_clients').insert({
      user_id: userId,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      rgpd_consent: true,
      rgpd_consent_at: new Date().toISOString(),
    }).select().single();
    setSaving(false);
    if (error || !data) {
      toast.error('Erro a guardar cliente.');
      return;
    }
    toast.success('Cliente guardado.');
    onCreated?.(data as CreatedClient);
    onOpenChange(false);
    reset();
  };

  const Form = (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Dados Pessoais</div>
      <div>
        <Label>Nome Completo</Label>
        <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Morada</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <label className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer">
        <Checkbox checked={form.consent} onCheckedChange={(v) => setForm({ ...form, consent: !!v })} className="mt-0.5" />
        <span className="text-sm text-primary text-left">
          Declaro que obtive consentimento explícito do cliente para armazenar e processar estes dados para fins comerciais e de faturação (RGPD - Regulamento UE 2016/679).
        </span>
      </label>
      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'A guardar...' : 'Guardar Cliente'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
          Cancelar
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="text-center">
            <DrawerTitle className="font-heading text-xl">Novo Cliente</DrawerTitle>
            <DrawerDescription>Registo seguro e em conformidade com o RGPD.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{Form}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Novo Cliente</DialogTitle>
          <DialogDescription>Registo seguro e em conformidade com o RGPD.</DialogDescription>
        </DialogHeader>
        {Form}
      </DialogContent>
    </Dialog>
  );
}
