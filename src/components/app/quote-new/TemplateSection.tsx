import { LayoutTemplate, Check } from 'lucide-react';
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
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Modelo do orçamento">
          {QUOTE_LAYOUTS.map((o) => {
            const active = layout === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onLayoutChange(o.value)}
                className={cn(
                  'text-left rounded-lg border p-4 transition-colors',
                  active ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border hover:bg-muted/40',
                )}
              >
                <div className="flex items-center justify-between gap-2 font-semibold text-sm">
                  {o.label}
                  {active && <Check className="h-4 w-4 text-accent" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{o.description}</p>
              </button>
            );
          })}
        </div>

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
