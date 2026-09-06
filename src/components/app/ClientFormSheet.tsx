import { useState } from 'react';
import { z } from 'zod';
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

const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' })
    .max(120, { message: 'O nome não pode ter mais de 120 caracteres.' }),
  email: z
    .string()
    .trim()
    .max(255, { message: 'O email é demasiado longo.' })
    .email({ message: 'Email inválido.' })
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(30, { message: 'O telefone é demasiado longo.' })
    .regex(/^[0-9+()\s-]*$/, { message: 'Telefone só pode conter números e + ( ) - espaços.' })
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .max(255, { message: 'A morada é demasiado longa.' })
    .optional()
    .or(z.literal('')),
}).refine((v) => (v.email && v.email.length > 0) || (v.phone && v.phone.length > 0), {
  message: 'Indique pelo menos email ou telefone.',
  path: ['email'],
});

type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'address', string>>;

export function ClientFormSheet({ open, onOpenChange, userId, onCreated }: Props) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', consent: false });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setForm({ name: '', email: '', phone: '', address: '', consent: false });
    setErrors({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('Sessão expirada. Inicie sessão novamente.');
      return;
    }

    const parsed = clientSchema.safeParse({
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error(parsed.error.issues[0]?.message ?? 'Verifique os campos do formulário.');
      return;
    }

    if (!form.consent) {
      toast.error('Confirme o consentimento RGPD do cliente.');
      return;
    }

    setErrors({});
    setSaving(true);
    const values = parsed.data;
    const { data, error } = await supabase.from('app_clients').insert({
      user_id: userId,
      name: values.name,
      email: values.email ? values.email : null,
      phone: values.phone ? values.phone : null,
      address: values.address ? values.address : null,
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

  const errorClass = 'border-destructive focus-visible:ring-destructive';

  const Form = (
    <form onSubmit={handleSave} className="space-y-4" noValidate>
      <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Dados Pessoais</div>
      <div>
        <Label htmlFor="client-name">Nome Completo *</Label>
        <Input
          id="client-name"
          value={form.name}
          onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: undefined }); }}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'client-name-error' : undefined}
          className={errors.name ? errorClass : ''}
          maxLength={120}
        />
        {errors.name && <p id="client-name-error" className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="client-email">Email</Label>
          <Input
            id="client-email"
            type="email"
            value={form.email}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: undefined }); }}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'client-email-error' : undefined}
            className={errors.email ? errorClass : ''}
            maxLength={255}
          />
          {errors.email && <p id="client-email-error" className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="client-phone">Telefone</Label>
          <Input
            id="client-phone"
            value={form.phone}
            onChange={(e) => { setForm({ ...form, phone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: undefined }); }}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'client-phone-error' : undefined}
            className={errors.phone ? errorClass : ''}
            maxLength={30}
            inputMode="tel"
          />
          {errors.phone && <p id="client-phone-error" className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="client-address">Morada</Label>
        <Input
          id="client-address"
          value={form.address}
          onChange={(e) => { setForm({ ...form, address: e.target.value }); if (errors.address) setErrors({ ...errors, address: undefined }); }}
          aria-invalid={!!errors.address}
          aria-describedby={errors.address ? 'client-address-error' : undefined}
          className={errors.address ? errorClass : ''}
          maxLength={255}
        />
        {errors.address && <p id="client-address-error" className="text-xs text-destructive mt-1">{errors.address}</p>}
      </div>
      <label htmlFor="client-consent" className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer">
        <Checkbox id="client-consent" checked={form.consent} onCheckedChange={(v) => setForm({ ...form, consent: !!v })} className="mt-0.5" />
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
