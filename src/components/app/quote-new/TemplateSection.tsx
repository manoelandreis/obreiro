import { LayoutTemplate, Check, ExternalLink } from 'lucide-react';

// Public demo quotes showing each template as the client sees it.
const EXAMPLE_LINKS: Record<QuoteLayout, string> = {
  classic: '/q/0722d1c9-fe21-4d68-9e6f-c9289e0b7eae',
  detailed: '/q/6789c20f-307b-4fb5-86c9-a59ff55cd4e0',
  executive: '/q/0a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d',
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { QUOTE_LAYOUTS, type QuoteExtras, type QuoteLayout } from '@/lib/quoteLayout';

interface Props {
  layout: QuoteLayout;
  onLayoutChange: (l: QuoteLayout) => void;
  extras: QuoteExtras;
  onExtrasChange: (e: QuoteExtras) => void;
}

export function TemplateSection({ layout, onLayoutChange, extras, onExtrasChange }: Props) {
  const set = (k: keyof QuoteExtras, v: string) => onExtrasChange({ ...extras, [k]: v });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><LayoutTemplate className="h-4 w-4" /> Modelo do orçamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Modelo do orçamento">
          {QUOTE_LAYOUTS.map((o) => {
            const active = layout === o.value;
            return (
              <div key={o.value} className="flex flex-col gap-1.5">
              <button
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onLayoutChange(o.value)}
                className={cn(
                  'h-full text-left rounded-lg border p-4 transition-colors',
                  active ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border hover:bg-muted/40',
                )}
              >
                <div className="flex items-center justify-between gap-2 font-semibold text-sm">
                  {o.label}
                  {active && <Check className="h-4 w-4 text-accent" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{o.description}</p>
              </button>
              <a href={EXAMPLE_LINKS[o.value]} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 self-start px-1 text-xs font-medium text-accent hover:underline">
                Ver exemplo <ExternalLink className="h-3 w-3" />
              </a>
              </div>
            );
          })}
        </div>

        {layout === 'executive' && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <Label htmlFor="tpl-scope">Âmbito dos trabalhos (um por linha)</Label>
              <Textarea id="tpl-scope" rows={4} value={extras.scope || ''} placeholder={'Se ficar vazio, usamos os nomes dos serviços.\nLimpeza final e entrega da obra'} onChange={(e) => set('scope', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tpl-signer">Quem assina</Label>
              <Input id="tpl-signer" value={extras.signer || ''} placeholder="Ex: João Silva · Gerente" onChange={(e) => set('signer', e.target.value)} />
            </div>
          </div>
        )}

        {layout === 'detailed' && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <Label htmlFor="tpl-duration">Prazo estimado</Label>
              <Input id="tpl-duration" value={extras.estimatedDuration || ''} placeholder="Ex: 14 dias úteis" onChange={(e) => set('estimatedDuration', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tpl-about">Sobre a empresa</Label>
              <Textarea id="tpl-about" rows={3} value={extras.about || ''} placeholder="Ex: Empresa familiar com mais de 15 anos de experiência..." onChange={(e) => set('about', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tpl-notes">Notas importantes (uma por linha)</Label>
              <Textarea id="tpl-notes" rows={3} value={extras.importantNotes || ''} placeholder={'O orçamento inclui transporte e remoção de entulho.\nPrazo de validade de 30 dias.'} onChange={(e) => set('importantNotes', e.target.value)} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
