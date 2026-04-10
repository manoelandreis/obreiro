import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, ArrowRight, Download, Building2, Wrench, Package, Mail, ShieldCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  pricePerHour: number;
  hours: number;
  materials: MaterialItem[];
}

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  nif: string;
}

interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface QuoteTemplate {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  default_price: number | null;
  category: string | null;
}

const emptyMaterial = (): MaterialItem => ({
  id: crypto.randomUUID(),
  name: '',
  quantity: 1,
  unit: 'un',
  unitPrice: 0,
});

const emptyService = (): ServiceItem => ({
  id: crypto.randomUUID(),
  name: '',
  description: '',
  pricePerHour: 0,
  hours: 1,
  materials: [],
});

export default function Quote() {
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState<CompanyInfo>({ name: '', email: '', phone: '', address: '', nif: '' });
  const [client, setClient] = useState<ClientInfo>({ name: '', email: '', phone: '', address: '' });
  const [services, setServices] = useState<ServiceItem[]>([emptyService()]);
  const [notes, setNotes] = useState('');
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());

  // Track events silently
  const trackEvent = useCallback((event_type: string, extra?: { step_number?: number; template_id?: string; metadata?: Record<string, unknown> }) => {
    const row: Record<string, unknown> = {
      event_type,
      session_id: sessionIdRef.current,
      metadata: extra?.metadata ?? {},
    };
    if (extra?.step_number != null) row.step_number = extra.step_number;
    if (extra?.template_id) row.template_id = extra.template_id;
    supabase.from('quote_events').insert(row as never).then(() => {});
  }, []);

  useEffect(() => {
    supabase.from('quote_templates').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setTemplates(data as QuoteTemplate[]);
    });
    // Track initial step
    trackEvent('step_reached', { step_number: 1 });
  }, [trackEvent]);

  // Service helpers
  const addService = () => setServices([...services, emptyService()]);
  const removeService = (id: string) => setServices(services.filter((s) => s.id !== id));
  const updateService = (id: string, field: keyof Omit<ServiceItem, 'id' | 'materials'>, value: string | number) => {
    setServices(services.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  // Material helpers (scoped to a service)
  const addMaterial = (serviceId: string) => {
    setServices(services.map((s) =>
      s.id === serviceId ? { ...s, materials: [...s.materials, emptyMaterial()] } : s
    ));
  };
  const removeMaterial = (serviceId: string, materialId: string) => {
    setServices(services.map((s) =>
      s.id === serviceId ? { ...s, materials: s.materials.filter((m) => m.id !== materialId) } : s
    ));
  };
  const updateMaterial = (serviceId: string, materialId: string, field: keyof MaterialItem, value: string | number) => {
    setServices(services.map((s) =>
      s.id === serviceId
        ? { ...s, materials: s.materials.map((m) => (m.id === materialId ? { ...m, [field]: value } : m)) }
        : s
    ));
  };
  const addTemplateAsMaterial = (serviceId: string, t: QuoteTemplate) => {
    trackEvent('template_used', { template_id: t.id, metadata: { template_name: t.name, service_id: serviceId } });
    setServices(services.map((s) =>
      s.id === serviceId
        ? {
            ...s,
            materials: [...s.materials, {
              id: crypto.randomUUID(),
              name: t.name,
              quantity: 1,
              unit: t.unit || 'un',
              unitPrice: Number(t.default_price) || 0,
            }],
          }
        : s
    ));
  };

  // Totals
  const serviceLaborTotal = (svc: ServiceItem) => svc.pricePerHour * svc.hours;
  const serviceMaterialsTotal = (svc: ServiceItem) => svc.materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0);
  const serviceTotal = (svc: ServiceItem) => serviceLaborTotal(svc) + serviceMaterialsTotal(svc);

  const subtotalServices = services.reduce((sum, s) => sum + serviceLaborTotal(s), 0);
  const subtotalMaterials = services.reduce((sum, s) => sum + serviceMaterialsTotal(s), 0);
  const subtotal = subtotalServices + subtotalMaterials;
  const iva = subtotal * 0.23;
  const total = subtotal + iva;

  const allItemsCount = services.length + services.reduce((sum, s) => sum + s.materials.length, 0);

  const handleDownloadPDF = async () => {
    const servicesSummary = services.map(s => ({
      name: s.name,
      labor: serviceLaborTotal(s),
      materials: s.materials.map(m => ({ name: m.name, total: m.quantity * m.unitPrice })),
      total: serviceTotal(s),
    }));
    await supabase.from('quote_logs').insert({
      company_name: company.name,
      client_name: client.name,
      total_amount: total,
      items_count: allItemsCount,
      services_summary: servicesSummary as never,
    });
    trackEvent('download', { step_number: 4, metadata: { total, services_count: services.length } });

    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up bloqueado. Permita pop-ups para fazer download.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Orçamento - ${company.name || 'HandyFlow'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: 700; color: #3b82f6; }
            .info-block { margin-bottom: 20px; }
            .info-block h3 { font-size: 14px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
            .info-block p { font-size: 14px; line-height: 1.6; }
            .section-title { font-size: 16px; font-weight: 600; color: #1e293b; margin: 24px 0 12px; }
            .service-block { margin-bottom: 24px; }
            .service-header { font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
            .service-desc { font-size: 13px; color: #475569; margin-bottom: 8px; }
            .service-labor { font-size: 13px; color: #475569; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 0 0 8px; }
            th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .service-subtotal { text-align: right; font-size: 13px; color: #475569; margin-bottom: 4px; }
            .totals { text-align: right; margin-top: 20px; }
            .totals .total { font-size: 18px; font-weight: 700; color: #3b82f6; border-top: 2px solid #3b82f6; padding-top: 8px; margin-top: 8px; }
            .notes { margin-top: 30px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 13px; color: #475569; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer">Gerado com HandyFlow — handyflow.app</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleWaitlistNudge = async () => {
    if (!waitlistEmail) return;
    await supabase.from('waitlist_leads').insert({ email: waitlistEmail, source: 'quote_tool' });
    toast.success('Obrigado! Ficou na lista de espera.');
    setWaitlistEmail('');
  };

  const fmt = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-heading text-xl font-bold text-primary">HandyFlow</Link>
          <span className="text-sm text-muted-foreground">Gerador de Orçamentos</span>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Company Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Dados da Sua Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Nome da Empresa</Label><Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="Ex: Silva Construções" /></div>
                <div><Label>NIF</Label><Input value={company.nif} onChange={(e) => setCompany({ ...company, nif: e.target.value })} placeholder="Ex: 123456789" /></div>
                <div><Label>Email</Label><Input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} /></div>
              </div>
              <div><Label>Morada</Label><Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} /></div>
              <div className="flex justify-end">
                <Button onClick={() => { setStep(2); trackEvent('step_reached', { step_number: 2 }); }} className="gap-2">Seguinte <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Client Info */}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle>Dados do Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Nome do Cliente</Label><Input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} /></div>
                <div><Label>Morada</Label><Input value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} /></div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Anterior</Button>
                <Button onClick={() => { setStep(3); trackEvent('step_reached', { step_number: 3 }); }} className="gap-2">Seguinte <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Services with nested Materials */}
        {step === 3 && (
          <div className="space-y-6">
            {services.map((svc, idx) => (
              <Card key={svc.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" /> Serviço {idx + 1}
                    </span>
                    {services.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeService(svc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Service fields */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div><Label>Serviço</Label><Input value={svc.name} onChange={(e) => updateService(svc.id, 'name', e.target.value)} placeholder="Ex: Pintura Interior" /></div>
                    <div><Label>Descrição</Label><Input value={svc.description} onChange={(e) => updateService(svc.id, 'description', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Preço por Hora (€)</Label><Input type="number" min={0} step={0.01} value={svc.pricePerHour} onChange={(e) => updateService(svc.id, 'pricePerHour', Number(e.target.value))} /></div>
                    <div><Label>Horas Aproximadas</Label><Input type="number" min={0.5} step={0.5} value={svc.hours} onChange={(e) => updateService(svc.id, 'hours', Number(e.target.value))} /></div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    Mão de obra: <span className="font-medium text-foreground">{fmt(serviceLaborTotal(svc))}</span>
                  </div>

                  {/* Materials for this service */}
                  <div className="border-t pt-4 mt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Materiais para este serviço</span>
                    </div>

                    {templates.length > 0 && (
                      <div className="mb-3">
                        <Label className="text-muted-foreground text-xs mb-2 block">Adicionar template:</Label>
                        <div className="flex flex-wrap gap-2">
                          {templates.map((t) => (
                            <Button key={t.id} variant="outline" size="sm" onClick={() => addTemplateAsMaterial(svc.id, t)}>
                              + {t.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {svc.materials.map((mat, mIdx) => (
                      <div key={mat.id} className="border rounded-lg p-3 space-y-3 mb-3 bg-muted/30">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-muted-foreground">Material {mIdx + 1}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMaterial(svc.id, mat.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                        <div><Label className="text-xs">Material</Label><Input value={mat.name} onChange={(e) => updateMaterial(svc.id, mat.id, 'name', e.target.value)} placeholder="Ex: Tinta Interior" /></div>
                        <div className="grid grid-cols-3 gap-3">
                          <div><Label className="text-xs">Qtd</Label><Input type="number" min={1} value={mat.quantity} onChange={(e) => updateMaterial(svc.id, mat.id, 'quantity', Number(e.target.value))} /></div>
                          <div><Label className="text-xs">Unidade</Label><Input value={mat.unit} onChange={(e) => updateMaterial(svc.id, mat.id, 'unit', e.target.value)} /></div>
                          <div><Label className="text-xs">Preço Unit. (€)</Label><Input type="number" min={0} step={0.01} value={mat.unitPrice} onChange={(e) => updateMaterial(svc.id, mat.id, 'unitPrice', Number(e.target.value))} /></div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          Subtotal: <span className="font-medium text-foreground">{fmt(mat.quantity * mat.unitPrice)}</span>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addMaterial(svc.id)} className="gap-1 w-full">
                      <Plus className="h-3 w-3" /> Adicionar Material
                    </Button>
                  </div>

                  {/* Service total */}
                  <div className="border-t pt-3 text-right text-sm">
                    {svc.materials.length > 0 && (
                      <p className="text-muted-foreground">Materiais: <span className="font-medium text-foreground">{fmt(serviceMaterialsTotal(svc))}</span></p>
                    )}
                    <p className="font-semibold text-foreground">Total Serviço {idx + 1}: {fmt(serviceTotal(svc))}</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={addService} className="gap-2 w-full"><Plus className="h-4 w-4" /> Adicionar Serviço</Button>

            {/* Notes + Totals */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div><Label>Notas / Termos e Condições</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Pagamento a 30 dias..." rows={3} /></div>

                <div className="border-t pt-4 space-y-1 text-right">
                  <p className="text-sm text-muted-foreground">Mão de Obra: {fmt(subtotalServices)}</p>
                  <p className="text-sm text-muted-foreground">Materiais: {fmt(subtotalMaterials)}</p>
                  <p className="text-sm text-muted-foreground">Subtotal: {fmt(subtotal)}</p>
                  <p className="text-sm text-muted-foreground">IVA (23%): {fmt(iva)}</p>
                  <p className="text-lg font-bold text-foreground">Total: {fmt(total)}</p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Anterior</Button>
                  <Button onClick={() => { setStep(4); trackEvent('step_reached', { step_number: 4 }); }} className="gap-2">Ver Preview <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div ref={printRef}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, borderBottom: '3px solid #3b82f6', paddingBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{company.name || 'A Sua Empresa'}</div>
                      {company.nif && <p style={{ fontSize: 13, color: '#6b7280' }}>NIF: {company.nif}</p>}
                      {company.email && <p style={{ fontSize: 13, color: '#6b7280' }}>{company.email}</p>}
                      {company.phone && <p style={{ fontSize: 13, color: '#6b7280' }}>{company.phone}</p>}
                      {company.address && <p style={{ fontSize: 13, color: '#6b7280' }}>{company.address}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>ORÇAMENTO</h2>
                      <p style={{ fontSize: 13, color: '#6b7280' }}>Data: {new Date().toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Cliente</h3>
                    <p style={{ fontSize: 14 }}><strong>{client.name}</strong></p>
                    {client.email && <p style={{ fontSize: 13, color: '#475569' }}>{client.email}</p>}
                    {client.phone && <p style={{ fontSize: 13, color: '#475569' }}>{client.phone}</p>}
                    {client.address && <p style={{ fontSize: 13, color: '#475569' }}>{client.address}</p>}
                  </div>

                  {/* Per-service blocks */}
                  {services.map((svc, idx) => (
                    <div key={svc.id} style={{ marginBottom: 28 }}>
                      <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                        {idx + 1}. {svc.name || `Serviço ${idx + 1}`}
                      </p>
                      {svc.description && <p style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>{svc.description}</p>}
                      <p style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>
                        Mão de obra: {fmt(svc.pricePerHour)}/hora × {svc.hours}h = <strong>{fmt(serviceLaborTotal(svc))}</strong>
                      </p>

                      {svc.materials.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                          <thead>
                            <tr>
                              {['Material', 'Qtd', 'Unidade', 'Preço Unit.', 'Total'].map((h, i) => (
                                <th key={i} style={{ background: '#f1f5f9', textAlign: i >= 1 ? (i === 2 ? 'center' : 'right') : 'left', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {svc.materials.map((mat) => (
                              <tr key={mat.id}>
                                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>{mat.name}</td>
                                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontSize: 13, textAlign: 'right' }}>{mat.quantity}</td>
                                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontSize: 13, textAlign: 'center' }}>{mat.unit}</td>
                                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontSize: 13, textAlign: 'right' }}>{fmt(mat.unitPrice)}</td>
                                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{fmt(mat.quantity * mat.unitPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                        Total Serviço: {fmt(serviceTotal(svc))}
                      </div>
                    </div>
                  ))}

                  <div style={{ textAlign: 'right', marginTop: 16 }}>
                    <p style={{ fontSize: 14, color: '#475569' }}>Mão de Obra: {fmt(subtotalServices)}</p>
                    <p style={{ fontSize: 14, color: '#475569' }}>Materiais: {fmt(subtotalMaterials)}</p>
                    <p style={{ fontSize: 14, color: '#475569' }}>Subtotal: {fmt(subtotal)}</p>
                    <p style={{ fontSize: 14, color: '#475569' }}>IVA (23%): {fmt(iva)}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6', borderTop: '2px solid #3b82f6', paddingTop: 8, marginTop: 8, display: 'inline-block' }}>Total: {fmt(total)}</p>
                  </div>

                  {notes && (
                    <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569' }}>
                      <strong>Notas:</strong><br />{notes}
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6 border-t pt-4">
                  <Button variant="outline" onClick={() => setStep(3)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Editar</Button>
                  <Button onClick={handleDownloadPDF} className="gap-2"><Download className="h-4 w-4" /> Download PDF</Button>
                </div>
              </CardContent>
            </Card>

            {/* Waitlist nudge */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 text-center">
                <p className="font-heading font-semibold text-lg mb-2">Gostou? O melhor ainda está por vir!</p>
                <p className="text-sm text-muted-foreground mb-4">Deixe o seu email para saber quando lançarmos o app completo com gestão de clientes, projetos e muito mais.</p>
                <div className="flex gap-2 max-w-md mx-auto">
                  <Input type="email" placeholder="O seu email" value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} />
                  <Button onClick={handleWaitlistNudge}>Juntar-me</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
