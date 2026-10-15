import { Card, CardContent } from '@/components/ui/card';
import { hasDetails, lines, type QuoteExtras, type ServiceDetails } from '@/lib/quoteLayout';

const fmt = (v: number) => Number(v || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

interface Props {
  services: any[];
  extras: QuoteExtras;
  companyName: string;
}

/** Technical detail cards, company card and important notes for the detailed quote template. */
export function DetailedSections({ services, extras, companyName }: Props) {
  const notes = lines(extras.importantNotes);
  return (
    <>
      {services.map((s, i) => {
        const d: ServiceDetails = s.details || {};
        const mats = (s.materials || []).filter((m: any) => m.name);
        if (!hasDetails(d) && !mats.length) return null;
        const steps = lines(d.steps);
        const specs = lines(d.specs);
        return (
          <Card key={i}>
            <CardContent className="pt-6 space-y-3 text-sm">
              <h2 className="font-heading text-lg font-semibold flex items-baseline gap-3">
                <span className="text-2xl font-bold text-accent">{String(i + 1).padStart(2, '0')}</span>
                <span>{s.name || `Serviço ${i + 1}`} <span className="text-muted-foreground font-medium text-sm">(Detalhe Técnico)</span></span>
              </h2>
              {d.framing && <p><strong>Enquadramento:</strong> {d.framing}</p>}
              {d.objective && <p><strong>Objetivo:</strong> {d.objective}</p>}
              {steps.length > 0 && (
                <div>
                  <div className="font-semibold mb-1">Etapas do processo</div>
                  <ol className="list-decimal pl-5 space-y-0.5 text-muted-foreground">
                    {steps.map((l, k) => <li key={k}>{l}</li>)}
                  </ol>
                </div>
              )}
              {specs.length > 0 && (
                <div>
                  <div className="font-semibold mb-1">Especificações</div>
                  <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                    {specs.map((l, k) => <li key={k}>{l}</li>)}
                  </ul>
                </div>
              )}
              {mats.length > 0 && (
                <div>
                  <div className="font-semibold mb-1">Materiais aplicados</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                        <th className="py-1.5 font-semibold">Material / Item</th>
                        <th className="py-1.5 font-semibold w-20">Qtd.</th>
                        <th className="py-1.5 font-semibold w-24 text-right">Preço/Un.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mats.map((m: any, k: number) => (
                        <tr key={k} className="border-b last:border-0">
                          <td className="py-1.5">{m.name}</td>
                          <td className="py-1.5">{m.quantity} {m.unit}</td>
                          <td className="py-1.5 text-right">{fmt(m.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {extras.about && (
        <Card className="border-l-4 border-l-accent">
          <CardContent className="pt-6 space-y-1 text-sm">
            <div className="font-heading font-semibold text-primary">{companyName}</div>
            <p className="text-muted-foreground whitespace-pre-wrap">{extras.about}</p>
          </CardContent>
        </Card>
      )}

      {notes.length > 0 && (
        <div className="rounded-lg bg-muted/60 p-4 text-xs">
          <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">Notas importantes</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {notes.map((l, k) => <li key={k}>{l}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}
