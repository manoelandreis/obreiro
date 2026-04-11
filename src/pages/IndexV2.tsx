import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AppComingSoonSection from '@/components/AppComingSoonSection';
import {
  FileText, BarChart3, Users, ClipboardList, ArrowRight, ShieldCheck, Eye, Trash2,
  Plus, Download, Building2, Wrench, Package, Mail, ChevronDown, ChevronUp,
} from 'lucide-react';
import mockupTemplate from '@/assets/mockup-template.jpg';
import mockupTool from '@/assets/mockup-tool.jpg';

// ── Types ──
interface MaterialItem { id: string; name: string; quantity: number; unit: string; unitPrice: number; }
interface ServiceItem { id: string; name: string; description: string; pricePerHour: number; hours: number; materials: MaterialItem[]; }
interface CompanyInfo { name: string; email: string; phone: string; address: string; nif: string; }
interface ClientInfo { name: string; email: string; phone: string; address: string; }
interface QuoteTemplate { id: string; name: string; description: string | null; unit: string | null; default_price: number | null; category: string | null; }
interface ContentSection { section_key: string; title: string | null; subtitle: string | null; body: string | null; }

const emptyMaterial = (): MaterialItem => ({ id: crypto.randomUUID(), name: '', quantity: 1, unit: 'un', unitPrice: 0 });
const emptyService = (): ServiceItem => ({ id: crypto.randomUUID(), name: '', description: '', pricePerHour: 0, hours: 1, materials: [] });

const features = [
  { icon: FileText, title: 'Orçamentos Profissionais', desc: 'Crie orçamentos detalhados e com aspeto profissional em minutos.' },
  { icon: ClipboardList, title: 'Templates Reutilizáveis', desc: 'Use templates pré-definidos para os seus serviços mais comuns.' },
  { icon: BarChart3, title: 'Gestão Organizada', desc: 'Acompanhe todos os seus projetos e clientes num só lugar.' },
  { icon: Users, title: 'Impressione Clientes', desc: 'Transmita profissionalismo desde o primeiro contacto.' },
];

const fmt = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export default function IndexV2() {
  // ── Landing content ──
  const [content, setContent] = useState<Record<string, ContentSection>>({});
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  // ── Quote builder state ──
  const [company, setCompany] = useState<CompanyInfo>({ name: '', email: '', phone: '', address: '', nif: '' });
  const [client, setClient] = useState<ClientInfo>({ name: '', email: '', phone: '', address: '' });
  const [services, setServices] = useState<ServiceItem[]>([emptyService()]);
  const [notes, setNotes] = useState('');
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [sendEmail, setSendEmail] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ company: true, client: false, services: false, notes: false });
  const printRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  const quoteRef = useRef<HTMLDivElement>(null);

  const trackEvent = useCallback((event_type: string, extra?: { step_number?: number; template_id?: string; metadata?: Record<string, unknown> }) => {
    const row: Record<string, unknown> = { event_type, session_id: sessionIdRef.current, metadata: extra?.metadata ?? {} };
    if (extra?.step_number != null) row.step_number = extra.step_number;
    if (extra?.template_id) row.template_id = extra.template_id;
    supabase.from('quote_events').insert(row as never).then(() => {});
  }, []);

  useEffect(() => {
    supabase.from('landing_content').select('*').then(({ data }) => {
      if (data) {
        const map: Record<string, ContentSection> = {};
        data.forEach((item) => { map[item.section_key] = item; });
        setContent(map);
      }
    });
    supabase.from('quote_templates').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setTemplates(data as QuoteTemplate[]);
    });
  }, []);

  // ── Service / Material helpers ──
  const addService = () => setServices([...services, emptyService()]);
  const removeService = (id: string) => setServices(services.filter((s) => s.id !== id));
  const updateService = (id: string, field: keyof Omit<ServiceItem, 'id' | 'materials'>, value: string | number) => {
    setServices(services.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };
  const addMaterial = (serviceId: string) => {
    setServices(services.map((s) => s.id === serviceId ? { ...s, materials: [...s.materials, emptyMaterial()] } : s));
  };
  const removeMaterial = (serviceId: string, materialId: string) => {
    setServices(services.map((s) => s.id === serviceId ? { ...s, materials: s.materials.filter((m) => m.id !== materialId) } : s));
  };
  const updateMaterial = (serviceId: string, materialId: string, field: keyof MaterialItem, value: string | number) => {
    setServices(services.map((s) =>
      s.id === serviceId ? { ...s, materials: s.materials.map((m) => (m.id === materialId ? { ...m, [field]: value } : m)) } : s
    ));
  };
  const addTemplateAsMaterial = (serviceId: string, t: QuoteTemplate) => {
    trackEvent('template_used', { template_id: t.id, metadata: { template_name: t.name, service_id: serviceId } });
    setServices(services.map((s) =>
      s.id === serviceId
        ? { ...s, materials: [...s.materials, { id: crypto.randomUUID(), name: t.name, quantity: 1, unit: t.unit || 'un', unitPrice: Number(t.default_price) || 0 }] }
        : s
    ));
  };

  // ── Totals ──
  const serviceLaborTotal = (svc: ServiceItem) => svc.pricePerHour * svc.hours;
  const serviceMaterialsTotal = (svc: ServiceItem) => svc.materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0);
  const serviceTotal = (svc: ServiceItem) => serviceLaborTotal(svc) + serviceMaterialsTotal(svc);
  const subtotalServices = services.reduce((sum, s) => sum + serviceLaborTotal(s), 0);
  const subtotalMaterials = services.reduce((sum, s) => sum + serviceMaterialsTotal(s), 0);
  const subtotal = subtotalServices + subtotalMaterials;
  const iva = subtotal * 0.23;
  const total = subtotal + iva;
  const allItemsCount = services.length + services.reduce((sum, s) => sum + s.materials.length, 0);

  // ── Handlers ──
  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setWaitlistSubmitting(true);
    const { error } = await supabase.from('waitlist_leads').insert({ email: waitlistEmail, name: waitlistName, source: 'landing_v2' });
    setWaitlistSubmitting(false);
    if (error) { toast.error('Erro ao submeter. Tente novamente.'); }
    else { toast.success('Obrigado! Entrou na lista de espera.'); setWaitlistEmail(''); setWaitlistName(''); }
  };

  const handleDownloadPDF = async () => {
    const servicesSummary = services.map(s => ({ name: s.name, labor: serviceLaborTotal(s), materials: s.materials.map(m => ({ name: m.name, total: m.quantity * m.unitPrice })), total: serviceTotal(s) }));
    await supabase.from('quote_logs').insert({ company_name: company.name, client_name: client.name, total_amount: total, items_count: allItemsCount, services_summary: servicesSummary as never });
    trackEvent('download', { step_number: 4, metadata: { total, services_count: services.length } });
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Pop-up bloqueado. Permita pop-ups para fazer download.'); return; }
    printWindow.document.write(`<html><head><title>Orçamento - ${company.name || 'HandyFlow'}</title><style>
      @page { size: A4; margin: 20mm 15mm 25mm 15mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; }
      .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 16px; }
      .company-name { font-size: 22px; font-weight: 700; color: #3b82f6; }
      .service-block { margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
      table { width: 100%; border-collapse: collapse; margin: 0 0 8px; page-break-inside: avoid; break-inside: avoid; }
      thead { display: table-header-group; }
      th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
      td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
      tr { page-break-inside: avoid; break-inside: avoid; }
      .totals { text-align: right; margin-top: 16px; page-break-inside: avoid; break-inside: avoid; }
      .notes { margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #475569; page-break-inside: avoid; break-inside: avoid; }
      .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #9ca3af; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>${printContent.innerHTML}<div class="footer">Gerado com HandyFlow — handyflow.app</div></body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleSendByEmail = async () => {
    if (!sendEmail) { toast.error('Por favor insira o seu email.'); return; }
    setIsSendingEmail(true);
    try {
      if (consentChecked) { await supabase.from('waitlist_leads').insert({ email: sendEmail, name: client.name || null, source: 'quote_email_v2' }); }
      trackEvent('email_sent', { step_number: 4, metadata: { total, consent: consentChecked } });
      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'quote-delivery', recipientEmail: sendEmail, idempotencyKey: `quote-${sessionIdRef.current}`,
          templateData: {
            companyName: company.name || 'A Sua Empresa', clientName: client.name, total: fmt(total), subtotal: fmt(subtotal), iva: fmt(iva),
            services: services.map((s, i) => ({ name: s.name || `Serviço ${i + 1}`, laborTotal: fmt(serviceLaborTotal(s)), materialsTotal: fmt(serviceMaterialsTotal(s)), total: fmt(serviceTotal(s)) })),
          },
        },
      });
      if (error) throw error;
      toast.success('Orçamento enviado para o seu email!');
    } catch { toast.error('Não foi possível enviar o email. Faça download do PDF em vez disso.'); }
    finally { setIsSendingEmail(false); }
  };

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToQuote = () => {
    quoteRef.current?.scrollIntoView({ behavior: 'smooth' });
    setExpandedSections({ company: true, client: false, services: false, notes: false });
  };

  const hero = content['hero'];
  const about = content['about'];
  const cta = content['cta'];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-heading text-xl font-bold text-primary">HandyFlow</Link>
          <div className="flex items-center gap-4">
            <Link to="/quote"><Button variant="outline" size="sm">Versão Passo a Passo</Button></Link>
            <Link to="/admin"><Button variant="ghost" size="sm">Admin</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-8 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>100% seguro · Os seus dados nunca são guardados</span>
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            {hero?.title || 'Organize o seu negócio de construção'}
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            {hero?.subtitle || 'Crie orçamentos profissionais em minutos.'}
          </p>
          <div className="flex-col gap-4 justify-center flex sm:flex-col">
            <Button size="lg" className="gap-2 text-base" onClick={scrollToQuote}>
              Criar Orçamento Agora <ArrowRight className="h-4 w-4" />
            </Button>
            <a href="#waitlist">
              <Button size="lg" variant="outline" className="text-base">Juntar-me à Waitlist</Button>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════ INLINE QUOTE BUILDER ═══════════════════ */}
      <section ref={quoteRef} id="quote-builder" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-foreground mb-3">Crie o seu orçamento</h2>
            <p className="text-muted-foreground">Preencha os dados abaixo — tudo numa só página, sem passos.</p>
          </div>

          <div className="space-y-4">
            {/* ── Company ── */}
            <Card>
              <button onClick={() => toggleSection('company')} className="w-full">
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer py-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-5 w-5" /> Dados da Sua Empresa
                  </CardTitle>
                  {expandedSections.company ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardHeader>
              </button>
              {expandedSections.company && (
                <CardContent className="space-y-4 pt-0">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><Label>Nome da Empresa</Label><Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="Ex: Silva Construções" /></div>
                    <div><Label>NIF</Label><Input value={company.nif} onChange={(e) => setCompany({ ...company, nif: e.target.value })} placeholder="Ex: 123456789" /></div>
                    <div><Label>Email</Label><Input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} /></div>
                    <div><Label>Telefone</Label><Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} /></div>
                  </div>
                  <div><Label>Morada</Label><Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} /></div>
                </CardContent>
              )}
            </Card>

            {/* ── Client ── */}
            <Card>
              <button onClick={() => toggleSection('client')} className="w-full">
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer py-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5" /> Dados do Cliente
                  </CardTitle>
                  {expandedSections.client ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardHeader>
              </button>
              {expandedSections.client && (
                <CardContent className="space-y-4 pt-0">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><Label>Nome do Cliente</Label><Input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} /></div>
                    <div><Label>Email</Label><Input type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} /></div>
                    <div><Label>Telefone</Label><Input value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} /></div>
                    <div><Label>Morada</Label><Input value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} /></div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* ── Services ── */}
            <Card>
              <button onClick={() => toggleSection('services')} className="w-full">
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer py-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wrench className="h-5 w-5" /> Serviços e Materiais
                    {services.length > 0 && subtotal > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">({fmt(subtotal)})</span>
                    )}
                  </CardTitle>
                  {expandedSections.services ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardHeader>
              </button>
              {expandedSections.services && (
                <CardContent className="space-y-6 pt-0">
                  {services.map((svc, idx) => (
                    <div key={svc.id} className="border rounded-lg p-4 space-y-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm flex items-center gap-2">
                          <Wrench className="h-4 w-4" /> Serviço {idx + 1}
                        </span>
                        {services.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeService(svc.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div><Label className="text-xs">Serviço</Label><Input value={svc.name} onChange={(e) => updateService(svc.id, 'name', e.target.value)} placeholder="Ex: Pintura Interior" /></div>
                        <div><Label className="text-xs">Descrição</Label><Input value={svc.description} onChange={(e) => updateService(svc.id, 'description', e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Preço por Hora (€)</Label><Input type="number" min={0} step={0.01} value={svc.pricePerHour} onChange={(e) => updateService(svc.id, 'pricePerHour', Number(e.target.value))} /></div>
                        <div><Label className="text-xs">Horas Aprox.</Label><Input type="number" min={0.5} step={0.5} value={svc.hours} onChange={(e) => updateService(svc.id, 'hours', Number(e.target.value))} /></div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        Mão de obra: <span className="font-medium text-foreground">{fmt(serviceLaborTotal(svc))}</span>
                      </div>

                      {/* Materials */}
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">Materiais</span>
                        </div>
                        {templates.length > 0 && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {templates.map((t) => (
                                <Button key={t.id} variant="outline" size="sm" className="h-7 text-xs" onClick={() => addTemplateAsMaterial(svc.id, t)}>
                                  + {t.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        {svc.materials.map((mat, mIdx) => (
                          <div key={mat.id} className="border rounded-md p-3 space-y-2 mb-2 bg-background">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Material {mIdx + 1}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMaterial(svc.id, mat.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                            </div>
                            <div><Label className="text-xs">Material</Label><Input value={mat.name} onChange={(e) => updateMaterial(svc.id, mat.id, 'name', e.target.value)} placeholder="Ex: Tinta Interior" /></div>
                            <div className="grid grid-cols-3 gap-2">
                              <div><Label className="text-xs">Qtd</Label><Input type="number" min={1} value={mat.quantity} onChange={(e) => updateMaterial(svc.id, mat.id, 'quantity', Number(e.target.value))} /></div>
                              <div><Label className="text-xs">Unidade</Label><Input value={mat.unit} onChange={(e) => updateMaterial(svc.id, mat.id, 'unit', e.target.value)} /></div>
                              <div><Label className="text-xs">Preço Unit. (€)</Label><Input type="number" min={0} step={0.01} value={mat.unitPrice} onChange={(e) => updateMaterial(svc.id, mat.id, 'unitPrice', Number(e.target.value))} /></div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              Subtotal: <span className="font-medium text-foreground">{fmt(mat.quantity * mat.unitPrice)}</span>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addMaterial(svc.id)} className="gap-1 w-full h-8 text-xs">
                          <Plus className="h-3 w-3" /> Adicionar Material
                        </Button>
                      </div>

                      <div className="border-t pt-2 text-right text-sm">
                        {svc.materials.length > 0 && <p className="text-xs text-muted-foreground">Materiais: {fmt(serviceMaterialsTotal(svc))}</p>}
                        <p className="font-semibold text-foreground">Total Serviço {idx + 1}: {fmt(serviceTotal(svc))}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addService} className="gap-2 w-full"><Plus className="h-4 w-4" /> Adicionar Serviço</Button>
                </CardContent>
              )}
            </Card>

            {/* ── Notes ── */}
            <Card>
              <button onClick={() => toggleSection('notes')} className="w-full">
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer py-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5" /> Notas e Condições
                  </CardTitle>
                  {expandedSections.notes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardHeader>
              </button>
              {expandedSections.notes && (
                <CardContent className="pt-0">
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Pagamento a 30 dias..." rows={3} />
                </CardContent>
              )}
            </Card>

            {/* ── Totals Bar ── */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-sm text-center md:text-left">
                    <p className="text-muted-foreground">Mão de Obra: <span className="font-medium text-foreground">{fmt(subtotalServices)}</span></p>
                    <p className="text-muted-foreground">Materiais: <span className="font-medium text-foreground">{fmt(subtotalMaterials)}</span></p>
                    <p className="text-muted-foreground">IVA (23%): <span className="font-medium text-foreground">{fmt(iva)}</span></p>
                    <p className="text-lg font-bold text-foreground">Total: {fmt(total)}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
                      <Eye className="h-4 w-4" /> {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
                    </Button>
                    <Button onClick={handleDownloadPDF} className="gap-2">
                      <Download className="h-4 w-4" /> Download PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Preview ── */}
            {showPreview && (
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
                    {services.map((svc, idx) => (
                      <div key={svc.id} className="service-block" style={{ marginBottom: 28, pageBreakInside: 'avoid' }}>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{idx + 1}. {svc.name || `Serviço ${idx + 1}`}</p>
                        {svc.description && <p style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>{svc.description}</p>}
                        <p style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>Mão de obra: {fmt(svc.pricePerHour)}/hora × {svc.hours}h = <strong>{fmt(serviceLaborTotal(svc))}</strong></p>
                        {svc.materials.length > 0 && (
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                            <thead><tr>
                              {['Material', 'Qtd', 'Unidade', 'Preço Unit.', 'Total'].map((h, i) => (
                                <th key={i} style={{ background: '#f1f5f9', textAlign: i >= 1 ? (i === 2 ? 'center' : 'right') : 'left', padding: '6px 8px', fontSize: 11, textTransform: 'uppercase', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                              ))}
                            </tr></thead>
                            <tbody>
                              {svc.materials.map((mat) => (
                                <tr key={mat.id}>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', fontSize: 12 }}>{mat.name}</td>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', fontSize: 12, textAlign: 'right' }}>{mat.quantity}</td>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', fontSize: 12, textAlign: 'center' }}>{mat.unit}</td>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', fontSize: 12, textAlign: 'right' }}>{fmt(mat.unitPrice)}</td>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{fmt(mat.quantity * mat.unitPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>Total Serviço: {fmt(serviceTotal(svc))}</div>
                      </div>
                    ))}
                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                      <p style={{ fontSize: 14, color: '#475569' }}>Mão de Obra: {fmt(subtotalServices)}</p>
                      <p style={{ fontSize: 14, color: '#475569' }}>Materiais: {fmt(subtotalMaterials)}</p>
                      <p style={{ fontSize: 14, color: '#475569' }}>Subtotal: {fmt(subtotal)}</p>
                      <p style={{ fontSize: 14, color: '#475569' }}>IVA (23%): {fmt(iva)}</p>
                      <p style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6', borderTop: '2px solid #3b82f6', paddingTop: 8, marginTop: 8, display: 'inline-block' }}>Total: {fmt(total)}</p>
                    </div>
                    {notes && <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569' }}><strong>Notas:</strong><br />{notes}</div>}
                  </div>

                  {/* Email delivery */}
                  <div className="mt-6 border-t pt-6 space-y-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 space-y-4">
                      <div className="flex items-center gap-2 text-primary font-heading font-semibold">
                        <Mail className="h-5 w-5" /> Receber orçamento por email
                      </div>
                      <Input type="email" placeholder="O seu email" value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} />
                      <div className="flex items-start gap-2">
                        <Checkbox id="consent-v2" checked={consentChecked} onCheckedChange={(v) => setConsentChecked(v === true)} />
                        <label htmlFor="consent-v2" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                          Aceito receber comunicações da HandyFlow sobre novidades e funcionalidades. Pode cancelar a qualquer momento.
                        </label>
                      </div>
                      <Button onClick={handleSendByEmail} disabled={isSendingEmail} className="w-full gap-2">
                        <Mail className="h-4 w-4" /> {isSendingEmail ? 'A enviar...' : 'Enviar Orçamento por Email'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="h-4 w-4" /> Os dados do orçamento não são guardados — processamento 100% local no seu navegador.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════ REST OF LANDING PAGE ═══════════════════ */}

      {/* Product Snapshots */}
      <section className="pb-20 pt-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group rounded-2xl border bg-card overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="overflow-hidden"><img src={mockupTemplate} alt="Exemplo de orçamento gerado" className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" width={800} height={600} /></div>
              <div className="p-6"><h3 className="font-heading font-semibold text-lg mb-1">Orçamento Profissional</h3><p className="text-muted-foreground text-sm">Gere documentos prontos a enviar com todos os detalhes do serviço e materiais.</p></div>
            </div>
            <div className="group rounded-2xl border bg-card overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="overflow-hidden"><img src={mockupTool} alt="Ferramenta de criação de orçamentos" className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" width={800} height={600} /></div>
              <div className="p-6"><h3 className="font-heading font-semibold text-lg mb-1">Tudo Numa Só Página</h3><p className="text-muted-foreground text-sm">Preencha os dados, adicione serviços e materiais — sem passos, sem complicações.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy strip */}
      <section className="border-y bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Trash2 className="h-5 w-5 text-primary" /></div>
              <div><p className="font-medium text-sm">Nada é guardado</p><p className="text-muted-foreground text-xs">Dados desaparecem ao fechar</p></div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><ShieldCheck className="h-5 w-5 text-primary" /></div>
              <div><p className="font-medium text-sm">100% Privado</p><p className="text-muted-foreground text-xs">Processado no seu browser</p></div>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-end">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Eye className="h-5 w-5 text-primary" /></div>
              <div><p className="font-medium text-sm">Sem rastreamento</p><p className="text-muted-foreground text-xs">Sem partilha com terceiros</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-foreground mb-3">{content['features']?.title || 'Tudo o que precisa para crescer'}</h2>
            <p className="text-muted-foreground text-lg">{content['features']?.subtitle || 'Ferramentas pensadas para profissionais da construção'}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"><f.icon className="h-6 w-6 text-primary" /></div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* App Coming Soon */}
      <AppComingSoonSection />

      {/* About */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-3">{about?.title || 'Sobre a HandyFlow'}</h2>
          <p className="text-lg text-muted-foreground mb-4">{about?.subtitle || ''}</p>
          <p className="text-muted-foreground leading-relaxed">{about?.body || ''}</p>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 max-w-lg text-center">
          <h2 className="font-heading text-3xl font-bold mb-3">{cta?.title || 'Pronto para começar?'}</h2>
          <p className="mb-8 opacity-90">{cta?.subtitle || 'Junte-se à lista de espera.'}</p>
          <form onSubmit={handleWaitlist} className="space-y-3">
            <Input placeholder="O seu nome" value={waitlistName} onChange={(e) => setWaitlistName(e.target.value)} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60" />
            <Input type="email" required placeholder="O seu email" value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60" />
            <Button type="submit" disabled={waitlistSubmitting} variant="secondary" className="w-full" size="lg">{waitlistSubmitting ? 'A submeter...' : 'Entrar na Lista de Espera'}</Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} HandyFlow. Todos os direitos reservados.</div>
      </footer>
    </div>
  );
}
