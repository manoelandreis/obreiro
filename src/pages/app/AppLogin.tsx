import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppAuth } from '@/hooks/useAppAuth';
import { toast } from 'sonner';
import obreiroLogo from '@/assets/obreiro-logo.png.asset.json';

export default function AppLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAppAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/app" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message.includes('Invalid') ? 'Credenciais inválidas.' : error.message);
      return;
    }
    navigate('/app', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto rounded-[10px] shadow-accent-glow overflow-hidden" style={{ width: 56, height: 56 }}>
            <img src={obreiroLogo.url} alt="Obreiro" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="font-heading text-2xl">Entrar no Obreiro</CardTitle>
          <p className="text-sm text-muted-foreground">Aceda ao seu negócio.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Palavra-passe</Label>
                <Link to="/app/forgot-password" className="text-xs text-primary hover:underline">
                  Esqueci a palavra-passe
                </Link>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'A entrar...' : 'Entrar'}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-6">
            Ainda não tem conta?{' '}
            <Link to="/app/signup" className="text-primary font-medium hover:underline">
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
