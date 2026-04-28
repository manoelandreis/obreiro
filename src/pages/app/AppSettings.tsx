import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function AppSettings() {
  const { user, signOut } = useAppAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyNif, setCompanyNif] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [hasExistingPin, setHasExistingPin] = useState(false);
  const [initialPinEnabled, setInitialPinEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Never select pin_hash on the client.
    supabase.from('app_user_settings')
      .select('full_name, company_name, company_nif, company_email, company_phone, company_address, pin_enabled')
      .eq('user_id', user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? '');
          setCompanyName(data.company_name ?? '');
          setCompanyNif((data as any).company_nif ?? '');
          setCompanyEmail((data as any).company_email ?? '');
          setCompanyPhone((data as any).company_phone ?? '');
          setCompanyAddress((data as any).company_address ?? '');
          setPinEnabled(data.pin_enabled);
          setInitialPinEnabled(data.pin_enabled);
          setHasExistingPin(data.pin_enabled);
        }
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (pinEnabled && !hasExistingPin && !pin) {
      toast.error('Defina um PIN para ativar o bloqueio.');
      return;
    }
    if (pinEnabled && pin && !/^\d{4,8}$/.test(pin)) {
      toast.error('O PIN deve ter entre 4 e 8 dígitos.');
      return;
    }
    setSaving(true);

    // Save profile/company fields (PIN fields are managed exclusively by edge functions).
    const payload: any = {
      user_id: user.id,
      full_name: fullName.trim() || null,
      company_name: companyName.trim() || null,
      company_nif: companyNif.trim() || null,
      company_email: companyEmail.trim() || null,
      company_phone: companyPhone.trim() || null,
      company_address: companyAddress.trim() || null,
    };
    const { error } = await supabase.from('app_user_settings').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      setSaving(false);
      return toast.error('Erro a guardar.');
    }

    // Handle PIN changes via secure edge function.
    try {
      if (!pinEnabled && initialPinEnabled) {
        const { error: fnErr } = await supabase.functions.invoke('set-pin', { body: { enabled: false } });
        if (fnErr) throw fnErr;
        setHasExistingPin(false);
      } else if (pinEnabled && pin) {
        const { error: fnErr } = await supabase.functions.invoke('set-pin', { body: { pin } });
        if (fnErr) throw fnErr;
        setHasExistingPin(true);
      }
      setInitialPinEnabled(pinEnabled);
    } catch (e) {
      setSaving(false);
      return toast.error('Erro a guardar o PIN.');
    }

    setSaving(false);
    toast.success('Definições guardadas.');
    setPin('');
  };

  const deleteAll = async () => {
    if (!confirm('Eliminar TODOS os seus dados (clientes, trabalhos, definições)? Esta ação é irreversível.')) return;
    if (!user) return;
    await Promise.all([
      supabase.from('app_clients').delete().eq('user_id', user.id),
      supabase.from('app_jobs').delete().eq('user_id', user.id),
      supabase.from('app_user_settings').delete().eq('user_id', user.id),
    ]);
    toast.success('Dados eliminados.');
    await signOut();
    navigate('/app/login');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-3xl font-bold">Definições</h1>
        <p className="text-muted-foreground">Personalize a sua experiência e segurança.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Perfil do Utilizador</div>

          <div>
            <Label>O seu nome</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Dados da Empresa</div>
            <p className="text-sm text-muted-foreground -mt-2">Estes dados aparecem automaticamente em todos os orçamentos que criar.</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome da empresa</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex: Silva Construções" />
              </div>
              <div>
                <Label>NIF</Label>
                <Input value={companyNif} onChange={(e) => setCompanyNif(e.target.value)} placeholder="Ex: 123456789" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Morada</Label>
              <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Segurança PIN</div>
                <div className="text-sm text-muted-foreground">Ativar bloqueio por código PIN ao iniciar.</div>
              </div>
              <Switch checked={pinEnabled} onCheckedChange={setPinEnabled} />
            </div>
            {pinEnabled && (
              <div className="mt-4">
                <Label>{hasExistingPin ? 'Definir novo PIN (deixe vazio para manter)' : 'Novo PIN'}</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            )}
          </div>

          <div className="border-t border-border pt-6 space-y-3">
            <Button onClick={save} disabled={saving} className="w-full bg-foreground hover:bg-foreground/90 text-background">
              {saving ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
            <Button onClick={deleteAll} variant="ghost" className="w-full bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive">
              Eliminar Todos os Dados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
