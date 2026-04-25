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
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [existingPin, setExistingPin] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('app_user_settings').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFullName(data.full_name ?? '');
        setCompanyName(data.company_name ?? '');
        setPinEnabled(data.pin_enabled);
        setExistingPin(data.pin_hash);
      }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (pinEnabled && !existingPin && !pin) {
      toast.error('Defina um PIN para ativar o bloqueio.');
      return;
    }
    setSaving(true);
    const payload: any = {
      user_id: user.id,
      full_name: fullName.trim() || null,
      company_name: companyName.trim() || null,
      pin_enabled: pinEnabled,
    };
    if (pinEnabled && pin) payload.pin_hash = pin; // simple stored value (client-side gate only)
    if (!pinEnabled) payload.pin_hash = null;

    const { error } = await supabase.from('app_user_settings').upsert(payload, { onConflict: 'user_id' });
    setSaving(false);
    if (error) return toast.error('Erro a guardar.');
    toast.success('Definições guardadas.');
    setPin('');
    if (pinEnabled && pin) setExistingPin(pin);
    if (!pinEnabled) setExistingPin(null);
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

          <div>
            <Label>Nome da empresa</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
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
                <Label>{existingPin ? 'Definir novo PIN (deixe vazio para manter)' : 'Novo PIN'}</Label>
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
