import { useState, useMemo } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppAuth } from '@/hooks/useAppAuth';
import { toast } from 'sonner';
import obreiroLogo from '@/assets/obreiro-logo.png.asset.json';
import { evaluatePassword } from '@/lib/passwordPolicy';
import { PasswordStrengthMeter } from '@/components/app/PasswordStrengthMeter';

const emailSchema = z.string().trim().toLowerCase().email().max(255);

export default function AppSignup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { signUp, user } = useAppAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/app" replace />;

  const pwEval = useMemo(
    () => evaluatePassword(password, { email, name: fullName }),
    [password, email, fullName],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};

    if (fullName.trim().length < 2) next.name = 'Indique o seu nome.';
    const emailParsed = emailSchema.safeParse(email);
    if (!emailParsed.success) next.email = 'Email inválido.';
    if (!pwEval.valid) next.password = 'A palavra-passe não cumpre os requisitos.';

    if (Object.keys(next).length) {
      setErrors(next);
      toast.error(next.name ?? next.email ?? next.password ?? 'Verifique os campos.');
      return;
    }

    setErrors({});
    setLoading(true);
    const { error } = await signUp(emailParsed.data!, password, fullName.trim());
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('registered') || msg.includes('already')) {
        setErrors({ email: 'Já existe uma conta com este email.' });
        toast.error('Já existe uma conta com este email. Tente entrar.');
      } else if (msg.includes('pwned') || msg.includes('compromised') || msg.includes('weak')) {
        setErrors({ password: 'Esta palavra-passe foi encontrada em fugas de dados. Escolha outra.' });
        toast.error('Palavra-passe vulnerável. Escolha outra.');
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success('Conta criada! Verifique o seu email para confirmar.');
    navigate('/app/login', { replace: true });
  };

  const err = 'border-destructive focus-visible:ring-destructive';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto rounded-[10px] shadow-accent-glow overflow-hidden" style={{ width: 56, height: 56 }}>
            <img src={obreiroLogo.url} alt="Obreiro" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="font-heading text-2xl">Criar conta Obreiro</CardTitle>
          <p className="text-sm text-muted-foreground">Comece a gerir o seu negócio em minutos.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); if (errors.name) setErrors({ ...errors, name: undefined }); }}
                aria-invalid={!!errors.name}
                className={errors.name ? err : ''}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                aria-invalid={!!errors.email}
                className={errors.email ? err : ''}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password">Palavra-passe</Label>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'A criar...' : 'Criar conta'}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-6">
            Já tem conta?{' '}
            <Link to="/app/login" className="text-primary font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
