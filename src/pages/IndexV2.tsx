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
import {
  FileText, BarChart3, Users, ClipboardList, ArrowRight, ShieldCheck, Eye, Trash2,
  Plus, Download, Building2, Wrench, Package, Mail, ChevronDown, ChevronUp,
  Zap, Lock, Sparkles, Check, FileCheck, Repeat, HelpCircle,
} from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
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

const fmt = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

// ── Logo mark ──
const LogoMark = ({ size = 32 }: { size?: number }) => (
  <div
    className="flex items-center justify-center rounded-[10px] bg-gradient-to-br from-accent to-[hsl(27_92%_60%)] text-white shadow-accent-glow"
    style={{ width: size, height: size }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: size * 0.6, lineHeight: 1 }}>handyman</span>
  </div>
);

const WordMark = () => (
  <div className="flex items-center gap-2.5">
    <LogoMark size={32} />
    <span className="font-heading font-bold text-lg tracking-tight text-foreground">
      Obreiro
    </span>
  </div>
);


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
    printWindow.document.write(`<html><head><title>Orçamento - ${company.name || 'Obreiro'}</title><style>
      @page { size: A4; margin: 20mm 15mm 25mm 15mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #0F1B2A; }
      .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #1B3A5C; padding-bottom: 16px; }
      .company-name { font-size: 22px; font-weight: 700; color: #1B3A5C; }
      .service-block { margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
      table { width: 100%; border-collapse: collapse; margin: 0 0 8px; page-break-inside: avoid; break-inside: avoid; }
      thead { display: table-header-group; }
      th { background: #F5F5F5; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; color: #555; border-bottom: 2px solid #ECEEF0; }
      td { padding: 6px 8px; border-bottom: 1px solid #ECEEF0; font-size: 12px; }
      tr { page-break-inside: avoid; break-inside: avoid; }
      .totals { text-align: right; margin-top: 16px; page-break-inside: avoid; break-inside: avoid; }
      .notes { margin-top: 20px; padding: 12px; background: #FFF2E3; border-radius: 6px; font-size: 12px; color: #555; page-break-inside: avoid; break-inside: avoid; }
      .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #9aa0a6; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>${printContent.innerHTML}<div class="footer">Gerado com Obreiro — obreiro.app</div></body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleSendByEmail = async () => {
    if (!sendEmail) { toast.error('Por favor insira o seu email.'); return; }
    setIsSendingEmail(true);
    try {
      if (consentChecked) { await supabase.from('waitlist_leads').insert({ email: sendEmail, name: client.name || null, source: 'quote_email_v2' }); }
      trackEvent('email_sent', { step_number: 4, metadata: { total, consent: consentChecked } });
      const { error } = await supabase.functions.invoke('send-quote-email', {
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

  const features = [
    { icon: FileText, label: 'Orçamentos', desc: 'Profissionais em minutos' },
    { icon: ClipboardList, label: 'Templates', desc: 'Reutilize serviços comuns' },
    { icon: BarChart3, label: 'Gestão', desc: 'Projetos num só lugar' },
    { icon: Users, label: 'Clientes', desc: 'CRM ligado aos orçamentos' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ─────── NAVBAR ─────── */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
          <Link to="/"><WordMark /></Link>
          <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#sobre" className="hover:text-foreground transition-colors">Sobre</a>
            <a href="#exemplos" className="hover:text-foreground transition-colors">Exemplos</a>
            <a href="#quote-builder" className="hover:text-foreground transition-colors">Orçamento</a>
            <a href="#waitlist" className="hover:text-foreground transition-colors">Waitlist</a>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="accent" onClick={scrollToQuote}>Criar orçamento</Button>
          </div>
        </div>
      </nav>

      {/* ─────── HERO ─────── */}
      <section className="px-6 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              <Sparkles className="h-3 w-3" /> Para construtores portugueses
            </div>
            <h1 className="mt-5 font-heading text-4xl md:text-6xl font-bold leading-[1.05] text-foreground text-balance">
              {hero?.title || 'A ferramenta de orçamentos que cabe na obra.'}
            </h1>
            <p className="mt-5 mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed">
              {hero?.subtitle || 'Crie, envie e organize orçamentos profissionais em minutos — do telemóvel, sem complicações.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="accent" onClick={scrollToQuote} className="gap-2 h-12 px-6">
                Criar Orçamento Agora <ArrowRight className="h-4 w-4" />
              </Button>
              <a href="#waitlist">
                <Button size="lg" variant="outline" className="h-12 px-6">Juntar-me à Waitlist</Button>
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
                100% seguro · Os seus dados nunca são guardados
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success shrink-0" strokeWidth={2.5} />
                PDF profissional com o teu logo, sempre alinhado
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success shrink-0" strokeWidth={2.5} />
                Templates reutilizáveis. Próximo orçamento em segundos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────── INLINE QUOTE BUILDER ─────── */}
      <section ref={quoteRef} id="quote-builder" className="px-6 py-20 bg-card border-y border-border scroll-mt-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              <FileText className="h-3 w-3" /> Experimente agora
            </span>
            <h2 className="mt-4 font-heading text-3xl md:text-4xl font-bold text-foreground text-balance">Crie o seu orçamento</h2>
            <p className="mt-3 text-muted-foreground">Tudo numa só página. Sem registo. Sem demoras.</p>
          </div>

          <div className="space-y-3">
            {/* ── Company ── */}
            <Card className="shadow-soft border-border">
              <button onClick={() => toggleSection('company')} className="w-full text-left">
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer py-4">
                  <CardTitle className="flex items-center gap-2 text-base font-heading">
                    <Building2 className="h-5 w-5 text-accent" strokeWidth={1.5} /> Dados da Sua Empresa
                  </CardTitle>
                  {expandedSections.company ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
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
            <Card className="shadow-soft border-border">
              <button onClick={() => toggleSection('client')} className="w-full text-left">
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer py-4">
                  <CardTitle className="flex items-center gap-2 text-base font-heading">
                    <Users className="h-5 w-5 text-accent" strokeWidth={1.5} /> Dados do Cliente
                  </CardTitle>
                  {expandedSections.client ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
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
            <Card className="shadow-soft border-border">
              <button onClick={() => toggleSection('services')} className="w-full text-left">
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer py-4">
                  <CardTitle className="flex items-center gap-2 text-base font-heading">
                    <Wrench className="h-5 w-5 text-accent" strokeWidth={1.5} /> Serviços e Materiais
                    {services.length > 0 && subtotal > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">({fmt(subtotal)})</span>
                    )}
                  </CardTitle>
                  {expandedSections.services ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </CardHeader>
              </button>
              {expandedSections.services && (
                <CardContent className="space-y-6 pt-0">
                  {services.map((svc, idx) => (
                    <div key={svc.id} className="border border-border rounded-xl p-4 space-y-4 bg-background">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-semibold text-sm flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} /> Serviço {idx + 1}
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
                        Mão de obra: <span className="font-semibold text-foreground">{fmt(serviceLaborTotal(svc))}</span>
                      </div>

                      {/* Materials */}
                      <div className="border-t border-border pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                          <span className="text-xs font-semibold">Materiais</span>
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
                          <div key={mat.id} className="border border-border rounded-lg p-3 space-y-2 mb-2 bg-card">
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
                              Subtotal: <span className="font-semibold text-foreground">{fmt(mat.quantity * mat.unitPrice)}</span>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addMaterial(svc.id)} className="gap-1 w-full h-8 text-xs">
                          <Plus className="h-3 w-3" /> Adicionar Material
                        </Button>
                      </div>

                      <div className="border-t border-border pt-2 text-right text-sm">
                        {svc.materials.length > 0 && <p className="text-xs text-muted-foreground">Materiais: {fmt(serviceMaterialsTotal(svc))}</p>}
                        <p className="font-heading font-bold text-foreground">Total Serviço {idx + 1}: {fmt(serviceTotal(svc))}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addService} className="gap-2 w-full"><Plus className="h-4 w-4" /> Adicionar Serviço</Button>
                </CardContent>
              )}
            </Card>

            {/* ── Notes ── */}
            <Card className="shadow-soft border-border">
              <button onClick={() => toggleSection('notes')} className="w-full text-left">
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer py-4">
                  <CardTitle className="flex items-center gap-2 text-base font-heading">
                    <FileText className="h-5 w-5 text-accent" strokeWidth={1.5} /> Notas e Condições
                  </CardTitle>
                  {expandedSections.notes ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </CardHeader>
              </button>
              {expandedSections.notes && (
                <CardContent className="pt-0">
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Pagamento a 30 dias..." rows={3} />
                </CardContent>
              )}
            </Card>

            {/* ── Totals Bar ── */}
            <Card className="bg-brand-dark text-brand-dark-foreground border border-brand-dark ring-1 ring-brand-dark-foreground/5 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5 text-sm text-center md:text-left text-brand-dark-foreground/70">
                    <p>Mão de Obra: <span className="font-semibold text-brand-dark-foreground">{fmt(subtotalServices)}</span></p>
                    <p>Materiais: <span className="font-semibold text-brand-dark-foreground">{fmt(subtotalMaterials)}</span></p>
                    <p>IVA (23%): <span className="font-semibold text-brand-dark-foreground">{fmt(iva)}</span></p>
                    <p className="text-xl font-heading font-bold text-brand-dark-foreground pt-1">Total: {fmt(total)}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                      className="gap-2 bg-transparent border-brand-dark-foreground/30 text-brand-dark-foreground hover:bg-brand-dark-foreground/10 hover:text-brand-dark-foreground hover:border-brand-dark-foreground/50 active:bg-brand-dark-foreground/15 focus-visible:ring-2 focus-visible:ring-brand-dark-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
                    >
                      <Eye className="h-4 w-4" /> {showPreview ? 'Ocultar' : 'Preview'}
                    </Button>
                    <Button
                      onClick={handleDownloadPDF}
                      className="gap-2 hover:bg-primary/90 active:bg-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
                    >
                      <Download className="h-4 w-4" /> Download PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Preview ── */}
            {showPreview && (
              <Card className="shadow-soft border-border">
                <CardContent className="pt-6">
                  <div ref={printRef}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, borderBottom: '3px solid #1B3A5C', paddingBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#1B3A5C', fontFamily: 'Poppins, sans-serif' }}>{company.name || 'A Sua Empresa'}</div>
                        {company.nif && <p style={{ fontSize: 13, color: '#555' }}>NIF: {company.nif}</p>}
                        {company.email && <p style={{ fontSize: 13, color: '#555' }}>{company.email}</p>}
                        {company.phone && <p style={{ fontSize: 13, color: '#555' }}>{company.phone}</p>}
                        {company.address && <p style={{ fontSize: 13, color: '#555' }}>{company.address}</p>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F1B2A', fontFamily: 'Poppins, sans-serif' }}>ORÇAMENTO</h2>
                        <p style={{ fontSize: 13, color: '#555' }}>Data: {new Date().toLocaleDateString('pt-PT')}</p>
                      </div>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.08em' }}>Cliente</h3>
                      <p style={{ fontSize: 14 }}><strong>{client.name}</strong></p>
                      {client.email && <p style={{ fontSize: 13, color: '#555' }}>{client.email}</p>}
                      {client.phone && <p style={{ fontSize: 13, color: '#555' }}>{client.phone}</p>}
                      {client.address && <p style={{ fontSize: 13, color: '#555' }}>{client.address}</p>}
                    </div>
                    {services.map((svc, idx) => (
                      <div key={svc.id} className="service-block" style={{ marginBottom: 28, pageBreakInside: 'avoid' }}>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#0F1B2A', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>{idx + 1}. {svc.name || `Serviço ${idx + 1}`}</p>
                        {svc.description && <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>{svc.description}</p>}
                        <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>Mão de obra: {fmt(svc.pricePerHour)}/hora × {svc.hours}h = <strong>{fmt(serviceLaborTotal(svc))}</strong></p>
                        {svc.materials.length > 0 && (
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                            <thead><tr>
                              {['Material', 'Qtd', 'Unidade', 'Preço Unit.', 'Total'].map((h, i) => (
                                <th key={i} style={{ background: '#F5F5F5', textAlign: i >= 1 ? (i === 2 ? 'center' : 'right') : 'left', padding: '6px 8px', fontSize: 11, textTransform: 'uppercase', color: '#555', borderBottom: '2px solid #ECEEF0' }}>{h}</th>
                              ))}
                            </tr></thead>
                            <tbody>
                              {svc.materials.map((mat) => (
                                <tr key={mat.id}>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #ECEEF0', fontSize: 12 }}>{mat.name}</td>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #ECEEF0', fontSize: 12, textAlign: 'right' }}>{mat.quantity}</td>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #ECEEF0', fontSize: 12, textAlign: 'center' }}>{mat.unit}</td>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #ECEEF0', fontSize: 12, textAlign: 'right' }}>{fmt(mat.unitPrice)}</td>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #ECEEF0', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{fmt(mat.quantity * mat.unitPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#0F1B2A' }}>Total Serviço: {fmt(serviceTotal(svc))}</div>
                      </div>
                    ))}
                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                      <p style={{ fontSize: 14, color: '#555' }}>Mão de Obra: {fmt(subtotalServices)}</p>
                      <p style={{ fontSize: 14, color: '#555' }}>Materiais: {fmt(subtotalMaterials)}</p>
                      <p style={{ fontSize: 14, color: '#555' }}>Subtotal: {fmt(subtotal)}</p>
                      <p style={{ fontSize: 14, color: '#555' }}>IVA (23%): {fmt(iva)}</p>
                      <p style={{ fontSize: 20, fontWeight: 700, color: '#1B3A5C', borderTop: '2px solid #1B3A5C', paddingTop: 8, marginTop: 8, display: 'inline-block', fontFamily: 'Poppins, sans-serif' }}>Total: {fmt(total)}</p>
                    </div>
                    {notes && <div style={{ marginTop: 24, padding: 16, background: '#FFF2E3', borderRadius: 8, fontSize: 13, color: '#555' }}><strong>Notas:</strong><br />{notes}</div>}
                  </div>

                  {/* Email delivery */}
                  <div className="mt-6 border-t border-border pt-6 space-y-4">
                    <div className="bg-accent-soft border border-accent/20 rounded-xl p-5 space-y-4">
                      <div className="flex items-center gap-2 text-accent font-heading font-semibold">
                        <Mail className="h-5 w-5" strokeWidth={1.5} /> Receber orçamento por email
                      </div>
                      <Input type="email" placeholder="O seu email" value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} />
                      <div className="flex items-start gap-2">
                        <Checkbox id="consent-v2" checked={consentChecked} onCheckedChange={(v) => setConsentChecked(v === true)} />
                        <label htmlFor="consent-v2" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                          Aceito receber comunicações da Obreiro sobre novidades e funcionalidades. Pode cancelar a qualquer momento.
                        </label>
                      </div>
                      <Button variant="accent" onClick={handleSendByEmail} disabled={isSendingEmail} className="w-full gap-2">
                        <Mail className="h-4 w-4" /> {isSendingEmail ? 'A enviar...' : 'Enviar Orçamento por Email'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-success" /> Os dados do orçamento não são guardados — processamento 100% local no seu navegador.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>


      {/* ─────── SECTION: Sem comissões ─────── */}
      <section id="sobre" className="px-6 py-20 scroll-mt-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight text-balance">
                Sem comissões.<br />Sem letras pequenas.
              </h2>
            </div>
            <div className="flex items-end">
              <p className="text-muted-foreground text-base leading-relaxed">
                Os seus dados são processados localmente. Os seus orçamentos são seus. Sempre.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: 'Privado por defeito', desc: 'Os dados do orçamento ficam no seu navegador. Nada é enviado.' },
              { icon: ShieldCheck, title: 'RGPD desde o dia 1', desc: 'Conforme com a legislação portuguesa e europeia.' },
              { icon: Zap, title: 'Sem fees por uso', desc: 'Pague pela ferramenta, não por cada orçamento que envia.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-base mb-1.5">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── SECTION: Exemplos de Orçamentos ─────── */}
      <section id="exemplos" className="px-6 py-20 bg-secondary/30 scroll-mt-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              <FileCheck className="h-3 w-3" /> Exemplos reais
            </span>
            <h2 className="mt-4 font-heading text-3xl md:text-4xl font-bold text-foreground text-balance">
              Veja como ficam os seus orçamentos
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Três exemplos de orçamentos profissionais criados em minutos com o Obreiro.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                category: 'Canalização',
                title: 'Reparação de fuga + substituição',
                desc: 'Orçamento de serviço pontual com mão de obra e materiais detalhados. Ideal para reparações rápidas.',
                pdf: '/exemplos/orcamento-canalizacao.pdf',
                preview: '/exemplos/orcamento-canalizacao.png',
              },
              {
                category: 'Pintura',
                title: 'Pintura interior de apartamento T2',
                desc: 'Orçamento por horas com discriminação de tintas e materiais consumíveis. Notas com condições e garantias.',
                pdf: '/exemplos/orcamento-pintura.pdf',
                preview: '/exemplos/orcamento-pintura.png',
              },
              {
                category: 'Remodelação',
                title: 'Remodelação integral de casa de banho',
                desc: 'Múltiplos serviços (construção, canalização, eletricidade) com subtotais por serviço e plano de pagamento.',
                pdf: '/exemplos/orcamento-remodelacao.pdf',
                preview: '/exemplos/orcamento-remodelacao.png',
              },
            ].map((quote) => (
              <div key={quote.title} className="flex flex-col">
                {/* PDF preview image */}
                <a
                  href={quote.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block rounded-2xl bg-card border border-border overflow-hidden shadow-soft hover:shadow-lg transition-all"
                  aria-label={`Ver orçamento ${quote.title} no navegador`}
                >
                  <div className="aspect-square overflow-hidden bg-secondary/50">
                    <img
                      src={quote.preview}
                      alt={`Pré-visualização do orçamento de ${quote.category.toLowerCase()}`}
                      loading="lazy"
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-background/95 backdrop-blur px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-sm">
                    <FileText className="h-3 w-3 text-accent" /> PDF
                  </span>
                </a>

                {/* Title + description + links (outside the image) */}
                <div className="pt-5 px-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-accent mb-1.5">
                    {quote.category}
                  </p>
                  <h3 className="font-heading font-bold text-lg text-foreground leading-tight mb-2">
                    {quote.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {quote.desc}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <a
                      href={quote.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-accent hover:text-accent/80 transition-colors"
                    >
                      <Eye className="h-4 w-4" /> Ver na web
                    </a>
                    <span className="text-border" aria-hidden="true">·</span>
                    <a
                      href={quote.pdf}
                      download
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-accent transition-colors"
                    >
                      <Download className="h-4 w-4" /> Download PDF
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button size="lg" variant="accent" onClick={scrollToQuote} className="gap-2 h-12 px-6">
              Criar o meu orçamento <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ─────── TESTIMONIAL ─────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-border bg-card p-10 md:p-14 text-center shadow-soft">
            <div className="text-accent text-4xl font-heading font-bold mb-4">"</div>
            <blockquote className="font-heading text-xl md:text-2xl font-semibold text-foreground leading-snug text-balance">
              Antes do Obreiro, perdia 2 horas por orçamento. Agora faço em 10 minutos, no carro, entre obras.
            </blockquote>
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-sm">JS</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">João Silva</p>
                <p className="text-xs text-muted-foreground">Construtor · Porto</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ─────── FAQ ─────── */}
      <section id="faq" className="px-6 py-20 bg-secondary/30">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              <HelpCircle className="h-3 w-3" /> Dúvidas comuns
            </span>
            <h2 className="mt-4 font-heading text-3xl md:text-4xl font-bold text-foreground text-balance">Perguntas Frequentes</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {[
              {
                q: 'O meu orçamento é guardado na vossa base de dados?',
                a: 'Não. Os dados do orçamento são processados localmente no seu navegador. Nada é enviado para os nossos servidores. Quando faz download do PDF ou envia por email, o processamento ocorre no seu dispositivo.',
              },
              {
                q: 'Preciso de criar conta para usar o gerador de orçamentos?',
                a: 'Não é necessário registo para criar e descarregar orçamentos. Preencha os dados, gere o PDF e está pronto. Para a app completa com gestão de clientes e histórico, pode juntar-se à waitlist.',
              },
              {
                q: 'Os cálculos de IVA estão actualizados com a legislação portuguesa?',
                a: 'Sim. O sistema usa a taxa de IVA padrão de 23% aplicável à maioria dos serviços de construção em Portugal. Estamos atentos a alterações legislativas para manter os cálculos sempre correctos.',
              },
              {
                q: 'Posso usar o meu próprio logotipo nos PDFs?',
                a: 'Sim. Basta inserir o nome da sua empresa nos dados da empresa e o cabeçalho do PDF ficará personalizado com a identidade da sua marca.',
              },
              {
                q: 'Como é garantida a privacidade dos meus dados?',
                a: 'A privacidade é o nosso pilar fundamental. Os dados do orçamento nunca saem do seu navegador. Não usamos cookies de tracking nos orçamentos. E somos totalmente conformes com o RGPD desde o dia 1.',
              },
            ].map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-xl border border-border bg-card px-6 shadow-sm data-[state=open]:shadow-soft"
              >
                <AccordionTrigger className="text-left font-heading font-semibold text-sm text-foreground hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─────── WAITLIST CTA ─────── */}
      <section id="waitlist" className="px-6 py-24 bg-navy-deep text-white relative overflow-hidden scroll-mt-20">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, hsl(27 92% 47% / 0.4), transparent 50%)' }} />
        <div className="mx-auto max-w-2xl text-center relative">
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4 text-balance">Pronto para o seu próximo orçamento?</h2>
          <p className="mb-10 text-white/70 text-lg">Junte-se à waitlist e seja dos primeiros a usar o app completo.</p>
          <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              required
              placeholder="O seu email"
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12"
            />
            <Button type="submit" disabled={waitlistSubmitting} variant="accent" size="lg" className="h-12 shrink-0">
              {waitlistSubmitting ? 'A submeter...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Sem spam</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Cancele quando quiser</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Feito em PT</span>
          </div>
        </div>
      </section>

      {/* ─────── FOOTER ─────── */}
      <footer className="px-6 py-16 border-t border-border bg-card">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <WordMark />
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Ferramentas para construtores portugueses. Simples como uma chave de fendas.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-sm mb-3">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#quote-builder" className="hover:text-foreground">Orçamento</a></li>
                <li><a href="#features" className="hover:text-foreground">Funcionalidades</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-sm mb-3">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#waitlist" className="hover:text-foreground">Waitlist</a></li>
                <li><Link to="/admin" className="hover:text-foreground">Admin</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacidade" className="hover:text-foreground transition-colors">RGPD & Privacidade</Link></li>
                <li><Link to="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link></li>
                <li>Termos</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Obreiro. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1.5">Feito em <span className="font-semibold">🇵🇹 Portugal</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
