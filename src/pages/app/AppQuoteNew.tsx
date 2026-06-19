import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Building2, Users, Wrench, Package, Plus, Trash2, ArrowLeft, FileText, Save, ChevronDown, ChevronUp, Wallet,
} from 'lucide-react';
import {
  PAYMENT_PRESETS, DEFAULT_PAYMENT_TERMS, presetById, expandInstallments, totalPercent,
  createEmptyTemplate,
  type PaymentPreset, type PaymentTerms, type CustomPaymentTemplate,
} from '@/lib/paymentTerms';

interface MaterialItem { id: string; name: string; quantity: number; unit: string; unitPrice: number; }
interface ServiceItem { id: string; name: string; description: string; pricePerHour: number; hours: number; materials: MaterialItem[]; }
interface ClientRow { id: string; name: string; email: string | null; phone: string | null; address: string | null; }
interface QuoteTemplate { id: string; name: string; unit: string | null; default_price: number | null; }

const emptyMaterial = (): MaterialItem => ({ id: crypto.randomUUID(), name: '', quantity: 1, unit: 'un', unitPrice: 0 });
const emptyService = (): ServiceItem => ({ id: crypto.randomUUID(), name: '', description: '', pricePerHour: 0, hours: 1, materials: [] });
const fmt = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export default function AppQuoteNew() {
  const { user } = useAppAuth();
  const navigate = useNavigate();

  // Company snapshot (from settings)
  const [company, setCompany] = useState({ name: '', email: '', phone: '', address: '', nif: '' });

  // Clients
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [openNewClient, setOpenNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '', rgpd: false });

  // Quote
  const [title, setTitle] = useState('Orçamento');
  const [services, setServices] = useState<ServiceItem[]>([emptyService()]);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(DEFAULT_PAYMENT_TERMS);
  const [paymentTemplates, setPaymentTemplates] = useState<CustomPaymentTemplate[]>([]);
  const [selectedPaymentKey, setSelectedPaymentKey] = useState<string>('100_end');
  const [openNewPayment, setOpenNewPayment] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState<CustomPaymentTemplate | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({ client: true, services: true, payment: false, notes: false });
  const [companyConfigured, setCompanyConfigured] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [{ data: settings }, { data: cs }, { data: tpl }] = await Promise.all([
        supabase.from('app_user_settings').select('full_name, company_name, company_nif, company_email, company_phone, company_address, default_payment_terms, payment_term_templates' as any).eq('user_id', user.id).maybeSingle(),
        supabase.from('app_clients').select('id, name, email, phone, address').order('name'),
        supabase.from('quote_templates').select('id, name, unit, default_price').eq('is_active', true),
      ]);
      if (settings) {
        const s = settings as any;
        setCompany({
          name: s.company_name || s.full_name || '',
          nif: s.company_nif || '',
          email: s.company_email || '',
          phone: s.company_phone || '',
          address: s.company_address || '',
        });
        setCompanyConfigured(!!(s.company_name || s.company_nif || s.company_email));
        const tpls: CustomPaymentTemplate[] = Array.isArray(s.payment_term_templates) ? s.payment_term_templates : [];
        setPaymentTemplates(tpls);
        if (s.default_payment_terms) {
          const dpt = s.default_payment_terms as PaymentTerms;
          setPaymentTerms(dpt);
          if (dpt.preset === 'custom') {
            const match = tpls.find((t) => JSON.stringify(t.installments) === JSON.stringify(dpt.installments));
            setSelectedPaymentKey(match ? `tpl:${match.id}` : (tpls[0] ? `tpl:${tpls[0].id}` : '100_end'));
          } else {
            setSelectedPaymentKey(dpt.preset);
          }
        }
      } else {
        setCompanyConfigured(false);
      }
      if (cs) setClients(cs);
      if (tpl) setTemplates(tpl as QuoteTemplate[]);
    })();
  }, [user]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newClient.rgpd) return toast.error('É necessário consentimento RGPD.');
    const { data, error } = await supabase.from('app_clients').insert({
      user_id: user.id,
      name: newClient.name.trim(),
      email: newClient.email.trim() || null,
      phone: newClient.phone.trim() || null,
      address: newClient.address.trim() || null,
      rgpd_consent: true,
      rgpd_consent_at: new Date().toISOString(),
    }).select().single();
    if (error || !data) return toast.error('Erro a criar cliente.');
    setClients([...clients, data]);
    setSelectedClientId(data.id);
    setOpenNewClient(false);
    setNewClient({ name: '', email: '', phone: '', address: '', rgpd: false });
    toast.success('Cliente criado.');
  };

  // Service helpers
  const addService = () => setServices([...services, emptyService()]);
  const removeService = (id: string) => setServices(services.filter((s) => s.id !== id));
  const updateService = (id: string, field: keyof Omit<ServiceItem, 'id' | 'materials'>, value: string | number) =>
    setServices(services.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  const addMaterial = (sid: string) =>
    setServices(services.map((s) => s.id === sid ? { ...s, materials: [...s.materials, emptyMaterial()] } : s));
  const removeMaterial = (sid: string, mid: string) =>
    setServices(services.map((s) => s.id === sid ? { ...s, materials: s.materials.filter((m) => m.id !== mid) } : s));
  const updateMaterial = (sid: string, mid: string, field: keyof MaterialItem, value: string | number) =>
    setServices(services.map((s) => s.id === sid
      ? { ...s, materials: s.materials.map((m) => (m.id === mid ? { ...m, [field]: value } : m)) }
      : s));
  const addTemplateAsMaterial = (sid: string, t: QuoteTemplate) =>
    setServices(services.map((s) => s.id === sid
      ? { ...s, materials: [...s.materials, { id: crypto.randomUUID(), name: t.name, quantity: 1, unit: t.unit || 'un', unitPrice: Number(t.default_price) || 0 }] }
      : s));

  // Totals
  const serviceLabor = (s: ServiceItem) => s.pricePerHour * s.hours;
  const serviceMats = (s: ServiceItem) => s.materials.reduce((a, m) => a + m.quantity * m.unitPrice, 0);
  const serviceTotal = (s: ServiceItem) => serviceLabor(s) + serviceMats(s);
  const subtotal = services.reduce((a, s) => a + serviceTotal(s), 0);
  const iva = subtotal * 0.23;
  const total = subtotal + iva;

  const toggle = (k: keyof typeof expanded) => setExpanded((p) => ({ ...p, [k]: !p[k] }));

  const handleSave = async () => {
    if (!user) return;
    if (!selectedClientId) return toast.error('Selecione ou crie um cliente.');
    if (services.every((s) => !s.name.trim())) return toast.error('Adicione pelo menos um serviço.');
    setSaving(true);

    // 1) Create a Job linked to the client so we can populate Tarefas
    const { data: job, error: jobErr } = await supabase
      .from('app_jobs')
      .insert({
        user_id: user.id,
        client_id: selectedClientId,
        title: title.trim() || 'Orçamento',
        status: 'orcamento',
        estimated_value: total,
      })
      .select('id')
      .maybeSingle();

    if (jobErr || !job) {
      setSaving(false);
      return toast.error('Erro a criar trabalho associado.');
    }

    // 2) Create quote linked to that job
    const { data: quote, error } = await supabase
      .from('app_quotes')
      .insert({
        user_id: user.id,
        client_id: selectedClientId,
        job_id: job.id,
        title: title.trim() || 'Orçamento',
        company_snapshot: company as any,
        client_snapshot: selectedClient as any,
        services: services as any,
        notes: notes.trim() || null,
        payment_terms: paymentTerms as any,
        subtotal,
        iva,
        total,
      })
      .select('id')
      .maybeSingle();

    if (error || !quote) {
      setSaving(false);
      return toast.error('Erro a guardar orçamento.');
    }

    // 3) Auto-populate Tarefas: one group per service, with labour task + materials
    const validServices = services.filter((s) => s.name.trim());
    for (let i = 0; i < validServices.length; i++) {
      const s = validServices[i];
      const { data: group } = await supabase
        .from('app_job_groups')
        .insert({
          user_id: user.id,
          job_id: job.id,
          name: s.name.trim(),
          sort_order: i,
        })
        .select('id')
        .maybeSingle();
      if (!group) continue;

      const tasks: { user_id: string; group_id: string; description: string; sort_order: number }[] = [];
      if (s.description?.trim()) {
        tasks.push({ user_id: user.id, group_id: group.id, description: s.description.trim(), sort_order: 0 });
      }
      if (s.hours > 0) {
        tasks.push({
          user_id: user.id,
          group_id: group.id,
          description: `Mão de obra: ${s.hours}h × ${s.pricePerHour.toFixed(2)} €/h`,
          sort_order: tasks.length,
        });
      }
      if (tasks.length) await supabase.from('app_job_tasks').insert(tasks);

      if (s.materials.length) {
        await supabase.from('app_job_materials').insert(
          s.materials
            .filter((m) => m.name.trim())
            .map((m, idx) => ({
              user_id: user.id,
              group_id: group.id,
              description: `${m.name} — ${m.quantity} ${m.unit || 'un'} × ${Number(m.unitPrice).toFixed(2)} €`,
              sort_order: idx,
            }))
        );
      }
    }

    setSaving(false);
    toast.success('Orçamento guardado e tarefas criadas.');
    navigate('/app/quotes');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/quotes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-heading text-3xl font-bold">Novo Orçamento</h1>
            <p className="text-muted-foreground">Preencha os dados do cliente, serviços e materiais.</p>
          </div>
        </div>
        <Button className="gap-2" disabled={saving} onClick={handleSave}>
          <Save className="h-4 w-4" /> {saving ? 'A guardar...' : 'Guardar Orçamento'}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Título</CardTitle></CardHeader>
        <CardContent>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Orçamento Pintura Sala" />
        </CardContent>
      </Card>

      {!companyConfigured && (
        <Card className="border-warning/30 bg-warning-soft/60">
          <CardContent className="pt-6 flex items-start gap-3">
            <Building2 className="h-5 w-5 text-warning-soft-foreground mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-warning-soft-foreground">Dados da empresa em falta</div>
              <p className="text-sm text-warning-soft-foreground/90 mt-1">
                Configure os dados da sua empresa em <strong>Definições</strong> para aparecerem automaticamente nos orçamentos.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/settings')}>Ir para Definições</Button>
          </CardContent>
        </Card>
      )}

      {/* Client */}
      <Card>
        <button onClick={() => toggle('client')} className="w-full">
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" /> Cliente
              {selectedClient && <span className="ml-2 text-sm font-normal text-muted-foreground">— {selectedClient.name}</span>}
            </CardTitle>
            {expanded.client ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
        </button>
        {expanded.client && (
          <CardContent className="space-y-4 pt-0">
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <Label>Selecionar cliente existente</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger><SelectValue placeholder="Escolher cliente..." /></SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 && <div className="p-2 text-sm text-muted-foreground">Nenhum cliente ainda.</div>}
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => setOpenNewClient(true)}>
                <Plus className="h-4 w-4" /> Novo Cliente
              </Button>
            </div>

            {selectedClient && (
              <div className="grid md:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 text-sm">
                <div><span className="text-muted-foreground">Email:</span> {selectedClient.email || '—'}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {selectedClient.phone || '—'}</div>
                <div className="md:col-span-2"><span className="text-muted-foreground">Morada:</span> {selectedClient.address || '—'}</div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Services */}
      <Card>
        <button onClick={() => toggle('services')} className="w-full">
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-5 w-5" /> Serviços e Materiais
              {subtotal > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({fmt(subtotal)})</span>}
            </CardTitle>
            {expanded.services ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
        </button>
        {expanded.services && (
          <CardContent className="space-y-6 pt-0">
            {services.map((svc, idx) => (
              <div key={svc.id} className="border rounded-lg p-4 space-y-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold"><Wrench className="h-4 w-4" /> Serviço {idx + 1}</div>
                  {services.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeService(svc.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div><Label>Serviço</Label><Input value={svc.name} placeholder="Ex: Pintura Interior" onChange={(e) => updateService(svc.id, 'name', e.target.value)} /></div>
                  <div><Label>Descrição</Label><Input value={svc.description} onChange={(e) => updateService(svc.id, 'description', e.target.value)} /></div>
                </div>
                <div className="grid gap-3">
                  <div><Label>Preço por Hora (€)</Label><Input type="number" min={0} step={0.01} value={svc.pricePerHour} onChange={(e) => updateService(svc.id, 'pricePerHour', Number(e.target.value))} /></div>
                  <div><Label>Horas Aproximadas</Label><Input type="number" min={0.5} step={0.5} value={svc.hours} onChange={(e) => updateService(svc.id, 'hours', Number(e.target.value))} /></div>
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
                          <Button key={t.id} variant="outline" size="sm" onClick={() => addTemplateAsMaterial(svc.id, t)}>
                            + {t.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {svc.materials.map((mat) => (
                    <div key={mat.id} className="grid grid-cols-12 gap-2 items-end mb-2">
                      <div className="col-span-12 md:col-span-4"><Label className="text-xs">Material</Label><Input value={mat.name} onChange={(e) => updateMaterial(svc.id, mat.id, 'name', e.target.value)} /></div>
                      <div className="col-span-3 md:col-span-2"><Label className="text-xs">Qtd.</Label><Input type="number" min={0} step={0.01} value={mat.quantity} onChange={(e) => updateMaterial(svc.id, mat.id, 'quantity', Number(e.target.value))} /></div>
                      <div className="col-span-3 md:col-span-2"><Label className="text-xs">Un.</Label><Input value={mat.unit} onChange={(e) => updateMaterial(svc.id, mat.id, 'unit', e.target.value)} /></div>
                      <div className="col-span-4 md:col-span-3"><Label className="text-xs">Preço Un. (€)</Label><Input type="number" min={0} step={0.01} value={mat.unitPrice} onChange={(e) => updateMaterial(svc.id, mat.id, 'unitPrice', Number(e.target.value))} /></div>
                      <div className="col-span-2 md:col-span-1 flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => removeMaterial(svc.id, mat.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" size="sm" onClick={() => addMaterial(svc.id)} className="gap-2 mt-2">
                    <Plus className="h-4 w-4" /> Adicionar Material
                  </Button>
                </div>

                <div className="text-right text-sm font-semibold">
                  Total Serviço {idx + 1}: <span className="text-primary">{fmt(serviceTotal(svc))}</span>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addService} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Adicionar Serviço
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Payment terms */}
      <Card>
        <button onClick={() => toggle('payment')} className="w-full">
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5" /> Pagamento
              <span className="ml-2 text-sm font-normal text-muted-foreground truncate">
                — {selectedPaymentKey.startsWith('tpl:')
                  ? (paymentTemplates.find((t) => t.id === selectedPaymentKey.slice(4))?.name ?? 'Personalizado')
                  : presetById(paymentTerms.preset).label}
              </span>
            </CardTitle>
            {expanded.payment ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
        </button>
        {expanded.payment && (
          <CardContent className="space-y-4 pt-0">
            <div>
              <Label>Modelo</Label>
              <Select
                value={selectedPaymentKey}
                onValueChange={(v) => {
                  if (v === '__new') {
                    setPaymentDraft(createEmptyTemplate('Novo modelo'));
                    setOpenNewPayment(true);
                    return;
                  }
                  if (v.startsWith('tpl:')) {
                    const tpl = paymentTemplates.find((t) => t.id === v.slice(4));
                    if (tpl) {
                      setSelectedPaymentKey(v);
                      setPaymentTerms({ preset: 'custom', installments: tpl.installments.map((i) => ({ ...i })) });
                    }
                    return;
                  }
                  const p = presetById(v as PaymentPreset);
                  setSelectedPaymentKey(p.id);
                  setPaymentTerms({ preset: p.id, installments: p.installments.map((i) => ({ ...i })) });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentTemplates.map((t) => (
                    <SelectItem key={t.id} value={`tpl:${t.id}`}>{t.name}</SelectItem>
                  ))}
                  {paymentTemplates.length > 0 && <div className="my-1 border-t" />}
                  {PAYMENT_PRESETS.filter((p) => p.id !== 'custom').map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                  <div className="my-1 border-t" />
                  <SelectItem value="__new" className="text-primary font-medium">+ Novo modelo personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Pré-visualização</div>
              <div className="space-y-1">
                {expandInstallments(paymentTerms, total, new Date()).map((p, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_8rem_7rem] items-center gap-3 text-sm">
                    <span className="truncate">{p.label} <span className="text-muted-foreground">({p.percent}%)</span></span>
                    <span className="text-muted-foreground text-right">
                      vence {p.dueDate.toLocaleDateString('pt-PT')}
                    </span>
                    <span className="font-semibold text-primary text-right">{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* New custom payment template dialog */}
      <Dialog open={openNewPayment} onOpenChange={(o) => { setOpenNewPayment(o); if (!o) setPaymentDraft(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo método de pagamento personalizado</DialogTitle>
            <DialogDescription>Será guardado nos teus modelos e selecionado neste orçamento.</DialogDescription>
          </DialogHeader>
          {paymentDraft && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Nome do modelo</Label>
                <Input
                  value={paymentDraft.name}
                  placeholder="Ex.: 30% adiantamento + 70% à entrega"
                  onChange={(e) => setPaymentDraft({ ...paymentDraft, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                {paymentDraft.installments.map((i, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_5rem_7rem_2rem] gap-2 items-end">
                    <div>
                      {idx === 0 && <Label className="text-xs">Descrição</Label>}
                      <Input value={i.label} onChange={(e) => {
                        const next = [...paymentDraft.installments];
                        next[idx] = { ...next[idx], label: e.target.value };
                        setPaymentDraft({ ...paymentDraft, installments: next });
                      }} />
                    </div>
                    <div>
                      {idx === 0 && <Label className="text-xs">%</Label>}
                      <Input type="number" min={0} max={100} value={i.percent} onChange={(e) => {
                        const next = [...paymentDraft.installments];
                        next[idx] = { ...next[idx], percent: Number(e.target.value) };
                        setPaymentDraft({ ...paymentDraft, installments: next });
                      }} />
                    </div>
                    <div>
                      {idx === 0 && <Label className="text-xs">Dias após aceitação</Label>}
                      <Input type="number" min={0} value={i.due_offset_days} onChange={(e) => {
                        const next = [...paymentDraft.installments];
                        next[idx] = { ...next[idx], due_offset_days: Number(e.target.value) };
                        setPaymentDraft({ ...paymentDraft, installments: next });
                      }} />
                    </div>
                    <div className="flex justify-end">
                      {paymentDraft.installments.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => {
                          const next = paymentDraft.installments.filter((_, n) => n !== idx);
                          setPaymentDraft({ ...paymentDraft, installments: next });
                        }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                  setPaymentDraft({
                    ...paymentDraft,
                    installments: [...paymentDraft.installments, { label: `Parcela ${paymentDraft.installments.length + 1}`, percent: 0, due_offset_days: 30 }],
                  });
                }}>
                  <Plus className="h-4 w-4" /> Adicionar parcela
                </Button>
                {totalPercent({ preset: 'custom', installments: paymentDraft.installments }) !== 100 && (
                  <p className="text-xs text-destructive">
                    Soma das percentagens: {totalPercent({ preset: 'custom', installments: paymentDraft.installments })}% (deve ser 100%).
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setOpenNewPayment(false); setPaymentDraft(null); }} disabled={savingPayment}>
              Cancelar
            </Button>
            <Button
              disabled={savingPayment || !paymentDraft || !paymentDraft.name.trim() || totalPercent({ preset: 'custom', installments: paymentDraft?.installments ?? [] }) !== 100}
              onClick={async () => {
                if (!user || !paymentDraft) return;
                const name = paymentDraft.name.trim();
                if (paymentTemplates.some((t) => t.name.trim().toLowerCase() === name.toLowerCase())) {
                  return toast.error('Já existe um modelo com esse nome.');
                }
                const cleaned: CustomPaymentTemplate = { ...paymentDraft, name };
                const nextTpls = [...paymentTemplates, cleaned];
                setSavingPayment(true);
                const { error } = await supabase
                  .from('app_user_settings')
                  .upsert({ user_id: user.id, payment_term_templates: nextTpls } as any, { onConflict: 'user_id' });
                setSavingPayment(false);
                if (error) return toast.error('Erro a guardar modelo.');
                setPaymentTemplates(nextTpls);
                setPaymentTerms({ preset: 'custom', installments: cleaned.installments.map((i) => ({ ...i })) });
                setSelectedPaymentKey(`tpl:${cleaned.id}`);
                setOpenNewPayment(false);
                setPaymentDraft(null);
                toast.success('Modelo adicionado.');
              }}
            >
              {savingPayment ? 'A guardar...' : 'Adicionar e selecionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Notes */}
      <Card>
        <button onClick={() => toggle('notes')} className="w-full">
          <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
            <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5" /> Notas / Termos e Condições</CardTitle>
            {expanded.notes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
        </button>
        {expanded.notes && (
          <CardContent className="pt-0">
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condições de pagamento, prazos, garantia..." />
          </CardContent>
        )}
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6 space-y-2 text-right">
          <div className="text-sm text-muted-foreground">Subtotal: <span className="font-medium text-foreground">{fmt(subtotal)}</span></div>
          <div className="text-sm text-muted-foreground">IVA (23%): <span className="font-medium text-foreground">{fmt(iva)}</span></div>
          <div className="text-2xl font-bold text-primary border-t pt-2">Total: {fmt(total)}</div>
          <div className="pt-3">
            <Button size="lg" className="gap-2" disabled={saving} onClick={handleSave}>
              <Save className="h-4 w-4" /> {saving ? 'A guardar...' : 'Guardar Orçamento'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* New client dialog */}
      <Dialog open={openNewClient} onOpenChange={setOpenNewClient}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Novo Cliente</DialogTitle>
            <DialogDescription>Adicione um cliente ao seu CRM.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div><Label>Nome *</Label><Input required value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} /></div>
            </div>
            <div><Label>Morada</Label><Input value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} /></div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={newClient.rgpd} onCheckedChange={(v) => setNewClient({ ...newClient, rgpd: !!v })} className="mt-0.5" />
              <span className="text-muted-foreground">Confirmo que tenho consentimento RGPD do cliente para guardar estes dados.</span>
            </label>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenNewClient(false)}>Cancelar</Button>
              <Button type="submit">Criar Cliente</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
