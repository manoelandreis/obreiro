import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { QuoteLayout } from '@/lib/quoteLayout';

export interface PromptQuoteResult {
  title: string; importantNotes: string;
  services: { name: string; description: string; pricePerHour: number; hours: number; framing: string; objective: string; steps: string; specs: string;
    materials: { name: string; quantity: number; unit: string; unitPrice: number }[] }[];
}

const EXAMPLES = [
  { label: 'Pintura de apartamento', text: 'Pintura de sala e corredor de um T2, cerca de 45 m² de paredes e tetos. Algumas fissuras e humidade perto da janela. 2 baldes de tinta plástica mate branca 15L, primário anti-humidade, 2 sacos de massa de reparação, fita de pintor e plástico de proteção. Cerca de 20 horas a 22 €/hora.' },
  { label: 'Remodelação de WC', text: 'Remodelação de WC de 4 m². Demolir azulejos antigos, nova canalização multicamada, sanita suspensa e base de duche 120x80, azulejo novo nas paredes e chão. Cerca de 4 dias de trabalho a 25 €/hora.' },
  { label: 'Instalação elétrica', text: 'Substituir quadro elétrico antigo por quadro novo de 24 módulos com diferencial 30mA e 8 disjuntores, mais 6 tomadas novas na cozinha. Cerca de 10 horas a 28 €/hora.' },
];

interface Props { layout: QuoteLayout; signedIn: boolean; onApply: (r: PromptQuoteResult) => void; }

export function PromptAssistant({ layout, signedIn, onApply }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!signedIn) { toast.error('Crie conta ou entre para usar o assistente.'); return; }
    if (text.trim().length < 10) { toast.error('Descreva o trabalho em pelo menos uma frase.'); return; }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('quote-from-prompt', { body: { text, layout } });
    setLoading(false);
    if (error || !data?.services) {
      let msg = 'Não foi possível gerar o orçamento. Tente novamente.';
      try { const b = await (error as any)?.context?.json?.(); if (b?.error) msg = b.error; } catch { /* ignore */ }
      toast.error(msg); return;
    }
    onApply(data as PromptQuoteResult);
    toast.success('Serviços e materiais preenchidos. Reveja os valores antes de guardar.');
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-accent" /> Preencher com texto</div>
        <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} disabled={loading}
          aria-label="Descrição do trabalho"
          placeholder="Ex: Remodelação de WC de 4 m². Demolir azulejos, nova canalização, sanita suspensa e base de duche 120x80. Cerca de 4 dias a 25 €/hora…" />
        {!text && (
          <>
            <p className="text-sm text-muted-foreground">Dica: escreva ou dite no telemóvel as notas da visita — o trabalho, os materiais que vai comprar e o tempo aproximado. Os serviços e materiais são preenchidos e pode rever tudo antes de guardar.</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <Button key={ex.label} type="button" variant="outline" size="sm" onClick={() => setText(ex.text)}>{ex.label}</Button>
              ))}
            </div>
          </>
        )}
        <Button type="button" onClick={run} disabled={loading} className="w-full sm:w-auto">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> A gerar…</> : <><Sparkles className="h-4 w-4" /> Gerar serviços e materiais</>}
        </Button>
      </CardContent>
    </Card>
  );
}
