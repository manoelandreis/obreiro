import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import obreiroLogo from '@/assets/obreiro-logo.png.asset.json';
import { evaluatePassword } from '@/lib/passwordPolicy';
import { PasswordStrengthMeter } from '@/components/app/PasswordStrengthMeter';

export default function AppResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const navigate = useNavigate();

  const pwEval = useMemo(() => evaluatePassword(password, { email }), [password, email]);

  useEffect(() => {
    const run = async () => {
      const hash = window.location.hash;
      if (!hash.includes('type=recovery')) {
        toast.error('Link inválido ou expirado.');
        setValidating(false);
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        toast.error('Link inválido ou expirado.');
      } else {
        setEmail(data.session.user.email ?? undefined);
      }
      setValidating(false);
    };
    run();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!pwEval.valid) next.password = 'A palavra-passe não cumpre os requisitos.';
    if (password !== confirmPassword) next.confirm = 'As palavras-passe não coincidem.';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('pwned') || msg.includes('compromised') || msg.includes('weak')) {
        setErrors({ password: 'Esta palavra-passe foi encontrada em fugas de dados. Escolha outra.' });
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success('Palavra-passe atualizada com sucesso.');
    navigate('/app/login', { replace: true });
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6">
          <p className="text-muted-foreground">A validar link...</p>
        </Card>
      </div>
    );
  }

  const err = 'border-destructive focus-visible:ring-destructive';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto rounded-[10px] shadow-accent-glow overflow-hidden" style={{ width: 56, height: 56 }}>
            <img src={obreiroLogo.url} alt="Obreiro" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="font-heading text-2xl">Nova palavra-passe</CardTitle>
          <p className="text-sm text-muted-foreground">Defina uma nova palavra-passe para a sua conta.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="password">Nova palavra-passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }}
                aria-invalid={!!errors.password}
                className={errors.password ? err : ''}
              />
              <PasswordStrengthMeter evaluation={pwEval} show={password.length > 0} />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar palavra-passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirm) setErrors({ ...errors, confirm: undefined }); }}
                aria-invalid={!!errors.confirm}
                className={errors.confirm ? err : ''}
              />
              {errors.confirm && <p className="text-xs text-destructive mt-1">{errors.confirm}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'A guardar...' : 'Definir palavra-passe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
