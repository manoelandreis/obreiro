import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type State = 'validating' | 'ready' | 'submitting' | 'done' | 'already' | 'invalid';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('validating');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (r.ok && data?.valid) setState('ready');
        else if (data?.reason === 'already_unsubscribed') setState('already');
        else setState('invalid');
      })
      .catch(() => setState('invalid'));
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState('submitting');
    const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', { body: { token } });
    if (error) {
      setState('invalid');
      return;
    }
    if (data?.success) setState('done');
    else if (data?.reason === 'already_unsubscribed') setState('already');
    else setState('invalid');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl">Cancelar subscrição</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {state === 'validating' && (
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> A validar...
            </p>
          )}
          {state === 'ready' && (
            <>
              <p className="text-muted-foreground">
                Deixará de receber emails do Obreiro neste endereço. Tem a certeza?
              </p>
              <Button onClick={confirm} className="w-full">Confirmar cancelamento</Button>
            </>
          )}
          {state === 'submitting' && (
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> A processar...
            </p>
          )}
          {state === 'done' && (
            <div className="space-y-2">
              <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
              <p>Subscrição cancelada com sucesso.</p>
            </div>
          )}
          {state === 'already' && (
            <div className="space-y-2">
              <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground" />
              <p>Este endereço já tinha sido cancelado.</p>
            </div>
          )}
          {state === 'invalid' && (
            <div className="space-y-2">
              <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
              <p>Link inválido ou expirado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
