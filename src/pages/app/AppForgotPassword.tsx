import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import obreiroLogo from '@/assets/obreiro-logo.png.asset.json';

export default function AppForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/app/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success('Email enviado. Verifique a sua caixa de entrada.');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto rounded-[10px] shadow-accent-glow overflow-hidden" style={{ width: 56, height: 56 }}>
            <img src={obreiroLogo.url} alt="Obreiro" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="font-heading text-2xl">Recuperar palavra-passe</CardTitle>
          <p className="text-sm text-muted-foreground">
            Indique o seu email e enviaremos um link para redefinir a palavra-passe.
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Se existir uma conta associada a <strong>{email}</strong>, receberá um email com instruções.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/app/login">Voltar ao login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'A enviar...' : 'Enviar link'}
              </Button>
            </form>
          )}
          <p className="text-sm text-muted-foreground text-center mt-6">
            Lembrou-se da palavra-passe?{' '}
            <Link to="/app/login" className="text-primary font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
