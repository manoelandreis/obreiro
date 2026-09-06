import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Building2, ArrowLeft, Save } from 'lucide-react';
import { ClientFormSheet } from '@/components/app/ClientFormSheet';
import { ClientSection } from '@/components/app/quote-new/ClientSection';
import { ServicesSection } from '@/components/app/quote-new/ServicesSection';
import { PaymentSection } from '@/components/app/quote-new/PaymentSection';
import { NotesSection } from '@/components/app/quote-new/NotesSection';
import {
  DEFAULT_PAYMENT_TERMS,
  type PaymentTerms, type CustomPaymentTemplate,
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
  const [company, setCompany] = useState({ name: '', email: '', phone: '', address: '', nif: '', iban: '', mbway: '' });

  // Clients
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [openNewClient, setOpenNewClient] = useState(false);

  // Quote
  const [title, setTitle] = useState('Orçamento');
  const [services, setServices] = useState<ServiceItem[]>([emptyService()]);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(DEFAULT_PAYMENT_TERMS);
  const [paymentTemplates, setPaymentTemplates] = useState<CustomPaymentTemplate[]>([]);
  const [selectedPaymentKey, setSelectedPaymentKey] = useState<string>('100_end');
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({ client: true, services: true, payment: false, notes: false });
  const [companyConfigured, setCompanyConfigured] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [{ data: settings }, { data: cs }, { data: tpl }] = await Promise.all([
        supabase.from('app_user_settings').select('full_name, company_name, company_nif, company_email, company_phone, company_address, payment_iban, payment_mbway, default_payment_terms, payment_term_templates' as any).eq('user_id', user.id).maybeSingle(),
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
          iban: s.payment_iban || '',
          mbway: s.payment_mbway || '',
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
  const serviceTotal = (s: ServiceItem) => s.pricePerHour * s.hours + s.materials.reduce((a, m) => a + m.quantity * m.unitPrice, 0);
  const subtotal = services.reduce((a, s) => a + serviceTotal(s), 0);
  const iva = subtotal * 0.23;
  const total = subtotal + iva;

  const toggle = (k: keyof typeof expanded) => setExpanded((p) => ({ ...p, [k]: !p[k] }));

  const handleSave = async () => {
    if (!user) return;
    if (!selectedClientId) return toast.error('Selecione ou crie um cliente.');
    if (services.every((s) => !s.name.trim())) return toast.error('Adicione pelo menos um serviço.');
    const selectedClient = clients.find((c) => c.id === selectedClientId);
    setSaving(true);

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

    const validServices = services.filter((s) => s.name.trim());
    for (let i = 0; i < validServices.length; i++) {
      const s = validServices[i];
      const { data: group } = await supabase
        .from('app_job_groups')
        .insert({ user_id: user.id, job_id: job.id, name: s.name.trim(), sort_order: i })
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
        <Button className="gap-2 w-full sm:w-auto" disabled={saving} onClick={handleSave}>
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

      <ClientSection
        clients={clients}
        selectedClientId={selectedClientId}
        onSelectClient={setSelectedClientId}
        onNewClient={() => setOpenNewClient(true)}
        expanded={expanded.client}
        onToggle={() => toggle('client')}
      />

      <ServicesSection
        services={services}
        templates={templates}
        subtotal={subtotal}
        expanded={expanded.services}
        onToggle={() => toggle('services')}
        onAddService={addService}
        onRemoveService={removeService}
        onUpdateService={updateService}
        onAddMaterial={addMaterial}
        onRemoveMaterial={removeMaterial}
        onUpdateMaterial={updateMaterial}
        onAddTemplateAsMaterial={addTemplateAsMaterial}
      />

      <PaymentSection
        total={total}
        paymentTerms={paymentTerms}
        onPaymentTermsChange={setPaymentTerms}
        paymentTemplates={paymentTemplates}
        onPaymentTemplatesChange={setPaymentTemplates}
        selectedPaymentKey={selectedPaymentKey}
        onSelectedPaymentKeyChange={setSelectedPaymentKey}
        expanded={expanded.payment}
        onToggle={() => toggle('payment')}
        userId={user?.id}
      />

      <NotesSection
        notes={notes}
        onNotesChange={setNotes}
        expanded={expanded.notes}
        onToggle={() => toggle('notes')}
      />

      <Card>
        <CardContent className="pt-6 space-y-2 text-right">
          <div className="text-sm text-muted-foreground">Subtotal: <span className="font-medium text-foreground">{fmt(subtotal)}</span></div>
          <div className="text-sm text-muted-foreground">IVA (23%): <span className="font-medium text-foreground">{fmt(iva)}</span></div>
          <div className="text-2xl font-bold text-primary border-t pt-2">Total: {fmt(total)}</div>
          <div className="pt-3">
            <Button size="lg" className="gap-2 w-full" disabled={saving} onClick={handleSave}>
              <Save className="h-4 w-4" /> {saving ? 'A guardar...' : 'Guardar Orçamento'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ClientFormSheet
        open={openNewClient}
        onOpenChange={setOpenNewClient}
        userId={user?.id}
        onCreated={(c) => {
          setClients([...clients, { id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address }]);
          setSelectedClientId(c.id);
        }}
      />
    </div>
  );
}
