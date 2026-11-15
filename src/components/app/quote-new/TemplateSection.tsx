import { LayoutTemplate, Check, ExternalLink } from 'lucide-react';

// Public demo quotes showing each template as the client sees it.
const EXAMPLE_LINKS: Record<QuoteLayout, string> = {
  classic: '/q/0722d1c9-fe21-4d68-9e6f-c9289e0b7eae',
  detailed: '/q/6789c20f-307b-4fb5-86c9-a59ff55cd4e0',
  executive: '/q/0a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d',
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { QUOTE_LAYOUTS, type QuoteLayout } from '@/lib/quoteLayout';

interface Props {
  layout: QuoteLayout;
  onLayoutChange: (l: QuoteLayout) => void;
}

export function TemplateSection({ layout, onLayoutChange }: Props) {
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

      </CardContent>
    </Card>
  );
}
