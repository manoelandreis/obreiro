import { Wrench, Package, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CollapsibleSection } from '@/components/app/CollapsibleSection';

interface MaterialItem { id: string; name: string; quantity: number; unit: string; unitPrice: number; }
interface ServiceItem { id: string; name: string; description: string; pricePerHour: number; hours: number; materials: MaterialItem[]; }
interface QuoteTemplate { id: string; name: string; unit: string | null; default_price: number | null; }

interface ServicesSectionProps {
  services: ServiceItem[];
  templates: QuoteTemplate[];
  subtotal: number;
  expanded: boolean;
  onToggle: () => void;
  onAddService: () => void;
  onRemoveService: (id: string) => void;
  onUpdateService: (id: string, field: keyof Omit<ServiceItem, 'id' | 'materials'>, value: string | number) => void;
  onAddMaterial: (serviceId: string) => void;
  onRemoveMaterial: (serviceId: string, materialId: string) => void;
  onUpdateMaterial: (serviceId: string, materialId: string, field: keyof MaterialItem, value: string | number) => void;
  onAddTemplateAsMaterial: (serviceId: string, template: QuoteTemplate) => void;
}

const fmt = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export function ServicesSection({
  services,
  templates,
  subtotal,
  expanded,
  onToggle,
  onAddService,
  onRemoveService,
  onUpdateService,
  onAddMaterial,
  onRemoveMaterial,
  onUpdateMaterial,
  onAddTemplateAsMaterial,
}: ServicesSectionProps) {
  const serviceLabor = (s: ServiceItem) => s.pricePerHour * s.hours;
  const serviceMats = (s: ServiceItem) => s.materials.reduce((a, m) => a + m.quantity * m.unitPrice, 0);
  const serviceTotal = (s: ServiceItem) => serviceLabor(s) + serviceMats(s);

  return (
    <CollapsibleSection
      icon={Wrench}
      title="Serviços e Materiais"
      summary={subtotal > 0 ? `(${fmt(subtotal)})` : undefined}
      open={expanded}
      onToggle={onToggle}
    >
      <div className="space-y-6">
        {services.map((svc, idx) => (
          <div key={svc.id} className="border rounded-lg p-4 space-y-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold"><Wrench className="h-4 w-4" /> Serviço {idx + 1}</div>
              {services.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => onRemoveService(svc.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label>Serviço</Label><Input value={svc.name} placeholder="Ex: Pintura Interior" onChange={(e) => onUpdateService(svc.id, 'name', e.target.value)} /></div>
              <div><Label>Descrição</Label><Input value={svc.description} onChange={(e) => onUpdateService(svc.id, 'description', e.target.value)} /></div>
            </div>
            <div className="grid gap-3">
              <div><Label>Preço por Hora (€)</Label><Input type="number" min={0} step={0.01} value={svc.pricePerHour} onChange={(e) => onUpdateService(svc.id, 'pricePerHour', Number(e.target.value))} /></div>
              <div><Label>Horas Aproximadas</Label><Input type="number" min={0.5} step={0.5} value={svc.hours} onChange={(e) => onUpdateService(svc.id, 'hours', Number(e.target.value))} /></div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              Mão de obra: <span className="font-medium text-foreground">{fmt(serviceLabor(svc))}</span>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Materiais</span>
              </div>

              {templates.length > 0 && (
                <div className="mb-3">
                  <Label className="text-muted-foreground text-xs mb-2 block">Adicionar template:</Label>
                  <div className="flex flex-wrap gap-2">
                    {templates.map((t) => (
                      <Button key={t.id} variant="outline" size="sm" onClick={() => onAddTemplateAsMaterial(svc.id, t)}>
                        + {t.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {svc.materials.map((mat) => (
                <div key={mat.id} className="grid grid-cols-12 gap-2 items-end mb-2">
                  <div className="col-span-12 md:col-span-4"><Label className="text-xs">Material</Label><Input value={mat.name} onChange={(e) => onUpdateMaterial(svc.id, mat.id, 'name', e.target.value)} /></div>
                  <div className="col-span-3 md:col-span-2"><Label className="text-xs">Qtd.</Label><Input type="number" min={0} step={0.01} value={mat.quantity} onChange={(e) => onUpdateMaterial(svc.id, mat.id, 'quantity', Number(e.target.value))} /></div>
                  <div className="col-span-3 md:col-span-2"><Label className="text-xs">Un.</Label><Input value={mat.unit} onChange={(e) => onUpdateMaterial(svc.id, mat.id, 'unit', e.target.value)} /></div>
                  <div className="col-span-4 md:col-span-3"><Label className="text-xs">Preço Un. (€)</Label><Input type="number" min={0} step={0.01} value={mat.unitPrice} onChange={(e) => onUpdateMaterial(svc.id, mat.id, 'unitPrice', Number(e.target.value))} /></div>
                  <div className="col-span-2 md:col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => onRemoveMaterial(svc.id, mat.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={() => onAddMaterial(svc.id)} className="gap-2 mt-2">
                <Plus className="h-4 w-4" /> Adicionar Material
              </Button>
            </div>

            <div className="text-right text-sm font-semibold">
              Total Serviço {idx + 1}: <span className="text-primary">{fmt(serviceTotal(svc))}</span>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={onAddService} className="w-full gap-2">
          <Plus className="h-4 w-4" /> Adicionar Serviço
        </Button>
      </div>
    </CollapsibleSection>
  );
}
