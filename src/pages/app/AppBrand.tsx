import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { FeatureGate } from '@/components/app/FeatureGate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MobileSheetSelect, type SheetSelectOption } from '@/components/app/MobileSheetSelect';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Wallet,
  Plus,
  Pencil,
  Building2,
  FileText,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DEFAULT_PAYMENT_TERMS,
  PAYMENT_PRESETS,
  PaymentPreset,
  PaymentTerms,
  CustomPaymentTemplate,
  createEmptyTemplate,
  expandInstallments,
  presetById,
  totalPercent,
} from '@/lib/paymentTerms';
import {
  TermsTemplate,
  createEmptyTermsTemplate,
  DEFAULT_TERMS_CONTENT,
} from '@/lib/termsTemplates';
import { SectionHeader } from '@/components/app/SectionHeader';

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const fmt = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);

// ---------- Validators (Portugal) ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateEmail(v: string): string | null {
  if (!v) return null;
  if (v.length > 255) return 'Email demasiado longo.';
  if (!EMAIL_RE.test(v)) return 'Email inválido.';
  return null;
}

function validatePhonePT(v: string): string | null {
  if (!v) return null;
  const digits = v.replace(/[\s()-]/g, '');
  if (!/^\+?\d+$/.test(digits)) return 'Use apenas números, espaços, + ( ) -.';
  const national = digits.replace(/^\+351/, '').replace(/^00351/, '');
  if (national.length !== 9) return 'Número português deve ter 9 dígitos.';
  if (!/^[239]/.test(national)) return 'Número inválido (deve começar por 2, 3 ou 9).';
  return null;
}

function validateMbway(v: string): string | null {
  if (!v) return null;
  const digits = v.replace(/[\s()-]/g, '');
  if (!/^\+?\d+$/.test(digits)) return 'Use apenas números, espaços, + ( ) -.';
  const national = digits.replace(/^\+351/, '').replace(/^00351/, '');
  if (national.length !== 9) return 'Telemóvel português deve ter 9 dígitos.';
  if (!/^9/.test(national)) return 'MBWay requer um número de telemóvel (começa por 9).';
  return null;
}

function validateNifPT(v: string): string | null {
  if (!v) return null;
  const n = v.replace(/\s/g, '');
  if (!/^\d{9}$/.test(n)) return 'NIF deve ter 9 dígitos.';
  if (!/^[125689]|^3|^45|^70|^71|^72|^74|^75|^77|^78|^79|^90|^91|^98|^99/.test(n)) {
    // Permitir, mas o checksum é o que confirma. Continua a validar checksum abaixo.
  }
  const digits = n.split('').map(Number);
  const sum = digits.slice(0, 8).reduce((acc, d, i) => acc + d * (9 - i), 0);
  const mod = sum % 11;
  const check = mod < 2 ? 0 : 11 - mod;
  if (check !== digits[8]) return 'NIF inválido (dígito de controlo).';
  return null;
}

function validateIbanPT(v: string): string | null {
  if (!v) return null;
  const iban = v.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return 'IBAN inválido.';
  if (iban.startsWith('PT') && iban.length !== 25) return 'IBAN português deve ter 25 caracteres.';
  if (iban.length < 15 || iban.length > 34) return 'IBAN com tamanho inválido.';
  // mod-97 check
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const expanded = rearranged.replace(/[A-Z]/g, (c) => (c.charCodeAt(0) - 55).toString());
  let remainder = 0;
  for (let i = 0; i < expanded.length; i++) {
    remainder = (remainder * 10 + Number(expanded[i])) % 97;
  }
  if (remainder !== 1) return 'IBAN inválido (verificação falhou).';
  return null;
}

type CompanyErrors = Partial<Record<'nif' | 'email' | 'phone' | 'mbway' | 'iban', string>>;



export default function AppBrand() {
  const { user } = useAppAuth();
  const { isPro } = useSubscription();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [colorPrimary, setColorPrimary] = useState('#1B3A5C');
  const [colorAccent, setColorAccent] = useState('#E8730A');
  const [description, setDescription] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  // Company data
  const [companyName, setCompanyName] = useState('');
  const [companyNif, setCompanyNif] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [paymentMbway, setPaymentMbway] = useState('');
  const [paymentIban, setPaymentIban] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [companyErrors, setCompanyErrors] = useState<CompanyErrors>({});

  // Payment templates
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(DEFAULT_PAYMENT_TERMS);
  const [templates, setTemplates] = useState<CustomPaymentTemplate[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('100_end');
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [isNewTemplate, setIsNewTemplate] = useState(false);
  const [draft, setDraft] = useState<CustomPaymentTemplate | null>(null);
  const [deleteTplId, setDeleteTplId] = useState<string | null>(null);
  // Terms templates
  const [termsTemplates, setTermsTemplates] = useState<TermsTemplate[]>([]);
  const [selectedTermsKey, setSelectedTermsKey] = useState<string>('');
  const [termsDraft, setTermsDraft] = useState<TermsTemplate | null>(null);
  const [isNewTermsTpl, setIsNewTermsTpl] = useState(false);
  const [deleteTermsTplId, setDeleteTermsTplId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);


  const loadSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from('company-assets')
      .createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('app_user_settings')
        .select(
          'logo_url, brand_color_primary, brand_color_accent, company_description, company_terms, quote_validity_days, company_name, company_nif, company_email, company_phone, company_address, payment_mbway, payment_iban, default_payment_terms, payment_term_templates, terms_templates' as any
        )
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        const d: any = data;
        setLogoUrl(d.logo_url ?? null);
        if (d.logo_url) setLogoPreview(await loadSignedUrl(d.logo_url));
        setColorPrimary(d.brand_color_primary ?? '#1B3A5C');
        setColorAccent(d.brand_color_accent ?? '#E8730A');
        setDescription(d.company_description ?? '');
        setValidityDays(d.quote_validity_days ?? 30);
        setCompanyName(d.company_name ?? '');
        setCompanyNif(d.company_nif ?? '');
        setCompanyEmail(d.company_email ?? '');
        setCompanyPhone(d.company_phone ?? '');
        setCompanyAddress(d.company_address ?? '');
        setPaymentMbway(d.payment_mbway ?? '');
        setPaymentIban(d.payment_iban ?? '');
        const tpls: CustomPaymentTemplate[] = Array.isArray(d.payment_term_templates) ? d.payment_term_templates : [];
        setTemplates(tpls);
        if (d.default_payment_terms) {
          const dpt = d.default_payment_terms as PaymentTerms;
          setPaymentTerms(dpt);
          if (dpt.preset === 'custom') {
            const match = tpls.find(t => JSON.stringify(t.installments) === JSON.stringify(dpt.installments));
            setSelectedKey(match ? `tpl:${match.id}` : (tpls[0] ? `tpl:${tpls[0].id}` : '100_end'));
          } else {
            setSelectedKey(dpt.preset);
          }
        }
        const ttpls: TermsTemplate[] = Array.isArray(d.terms_templates) ? d.terms_templates : [];
        const legacy: string | null = d.company_terms ?? null;
        let initialTerms = ttpls;
        let initialKey = '';
        if (ttpls.length === 0 && legacy && legacy.trim().length > 0) {
          // Migrate legacy single-string terms into a template
          const t: TermsTemplate = { ...createEmptyTermsTemplate('Termos padrão'), content: legacy };
          initialTerms = [t];
          initialKey = `ttpl:${t.id}`;
        } else if (ttpls.length > 0) {
          initialKey = `ttpl:${ttpls[0].id}`;
        }
        setTermsTemplates(initialTerms);
        setSelectedTermsKey(initialKey);
      }
      setLoading(false);
    })();
  }, [user]);

  const onPickLogo = () => fileRef.current?.click();

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) return toast.error('Selecione uma imagem.');
    if (file.size > MAX_LOGO_BYTES) return toast.error('Logo até 5MB.');
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('company-assets')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      return toast.error('Falhou o upload do logo.');
    }
    if (logoUrl && logoUrl !== path) {
      await supabase.storage.from('company-assets').remove([logoUrl]);
    }
    setLogoUrl(path);
    setLogoPreview(await loadSignedUrl(path));
    setUploading(false);
    toast.success('Logo carregado.');
  };

  const removeLogo = async () => {
    if (!logoUrl) return;
    await supabase.storage.from('company-assets').remove([logoUrl]);
    setLogoUrl(null);
    setLogoPreview(null);
    toast.success('Logo removido.');
  };

  const validateCompany = (): CompanyErrors => {
    const errs: CompanyErrors = {};
    const nif = validateNifPT(companyNif.trim());
    if (nif) errs.nif = nif;
    const email = validateEmail(companyEmail.trim());
    if (email) errs.email = email;
    const phone = validatePhonePT(companyPhone.trim());
    if (phone) errs.phone = phone;
    const mb = validateMbway(paymentMbway.trim());
    if (mb) errs.mbway = mb;
    const iban = validateIbanPT(paymentIban.trim());
    if (iban) errs.iban = iban;
    return errs;
  };

  const saveCompany = async () => {
    if (!user) return;
    const errs = validateCompany();
    setCompanyErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Corrija os campos assinalados antes de guardar.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('app_user_settings')
      .upsert(
        {
          user_id: user.id,
          company_name: companyName.trim() || null,
          company_nif: companyNif.trim() || null,
          company_email: companyEmail.trim() || null,
          company_phone: companyPhone.trim() || null,
          company_address: companyAddress.trim() || null,
          company_description: description.trim() || null,
          payment_mbway: paymentMbway.trim() || null,
          payment_iban: paymentIban.trim().replace(/\s+/g, '') || null,
        } as any,
        { onConflict: 'user_id' },
      );
    setSaving(false);
    if (error) return toast.error('Erro a guardar.');
    toast.success('Dados atualizados.');
  };


  const saveBrand = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('app_user_settings')
      .upsert(
        {
          user_id: user.id,
          logo_url: logoUrl,
          brand_color_primary: colorPrimary,
          brand_color_accent: colorAccent,
        } as any,
        { onConflict: 'user_id' },
      );
    setSaving(false);
    if (error) return toast.error('Erro a guardar.');
    toast.success('Marca atualizada.');
  };

  const persistPaymentSettings = async (
    nextTemplates: CustomPaymentTemplate[],
    nextTerms: PaymentTerms,
    nextValidity?: number,
  ) => {
    if (!user) return false;
    const payload: any = {
      user_id: user.id,
      payment_term_templates: nextTemplates,
      default_payment_terms: nextTerms,
    };
    if (typeof nextValidity === 'number') payload.quote_validity_days = nextValidity;
    const { error } = await supabase
      .from('app_user_settings')
      .upsert(payload, { onConflict: 'user_id' });
    if (error) {
      toast.error('Erro a guardar.');
      return false;
    }
    return true;
  };

  const persistTermsTemplates = async (next: TermsTemplate[]) => {
    if (!user) return false;
    const { error } = await supabase
      .from('app_user_settings')
      .upsert(
        { user_id: user.id, terms_templates: next } as any,
        { onConflict: 'user_id' },
      );
    if (error) {
      toast.error('Erro a guardar.');
      return false;
    }
    return true;
  };


  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar...
      </div>
    );
  }

  // ============ Company card ============
  const Subsection = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <div className="space-y-3 pt-2">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );

  const companyCard = (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <SectionHeader
          icon={Building2}
          title="Dados da Empresa"
          description="Estes dados aparecem automaticamente em todos os orçamentos que criar."
        />

        <Subsection title="Identificação" description="Nome legal e número de contribuinte da empresa.">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nome da empresa</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex: Silva Construções" />
            </div>
            <div>
              <Label>NIF</Label>
              <Input value={companyNif} onChange={(e) => setCompanyNif(e.target.value)} placeholder="Ex: 123456789" />
            </div>
          </div>
        </Subsection>

        <Subsection title="Contactos" description="Como os clientes podem entrar em contacto consigo.">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="geral@empresa.pt" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+351 912 345 678" />
            </div>
            <div className="md:col-span-2">
              <Label>Morada</Label>
              <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Rua, número, código postal, localidade" />
            </div>
          </div>
        </Subsection>

        <Subsection title="Métodos de pagamento" description="Aparecem nos orçamentos para o cliente poder pagar diretamente.">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>MBWay</Label>
              <Input
                type="tel"
                inputMode="tel"
                value={paymentMbway}
                onChange={(e) => setPaymentMbway(e.target.value)}
                placeholder="+351 912 345 678"
              />
              <p className="text-xs text-muted-foreground mt-1">Número de telemóvel português associado ao MBWay.</p>
            </div>
            <div>
              <Label>IBAN</Label>
              <Input
                value={paymentIban}
                onChange={(e) => setPaymentIban(e.target.value.toUpperCase())}
                placeholder="PT50 0000 0000 0000 0000 0000 0"
              />
              <p className="text-xs text-muted-foreground mt-1">IBAN para transferência bancária.</p>
            </div>
          </div>
        </Subsection>

        <Subsection title="Sobre a empresa" description="Breve descrição que aparece nos orçamentos.">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
            rows={4}
            placeholder="Ex: A Silva Construções é uma empresa familiar com 20 anos de experiência..."
          />
          <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
        </Subsection>

        <div className="pt-2">
          <Button onClick={saveCompany} disabled={saving} size="sm">
            {saving ? 'A guardar...' : 'Guardar dados'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );


  // ============ Payment card ============
  const previewTotal = 1000;
  const todayStr = new Date().toLocaleDateString('pt-PT');
  const builtInPresets = PAYMENT_PRESETS.filter((p) => p.id !== 'custom');
  const selectedTpl = selectedKey.startsWith('tpl:')
    ? templates.find((t) => t.id === selectedKey.slice(4)) ?? null
    : null;
  const editing = draft !== null;
  const draftValid =
    !!draft && draft.name.trim().length > 0 && totalPercent({ preset: 'custom', installments: draft.installments }) === 100;

  const onSelectChange = (v: string) => {
    if (editing) return;
    if (v === '__new') {
      const tpl = createEmptyTemplate('Novo modelo');
      setDraft(tpl);
      setIsNewTemplate(true);
      setEditingTplId(tpl.id);
      setSelectedKey(`tpl:${tpl.id}`);
      setPaymentTerms({ preset: 'custom', installments: tpl.installments.map((i) => ({ ...i })) });
      return;
    }
    if (v.startsWith('tpl:')) {
      const tpl = templates.find((t) => t.id === v.slice(4));
      if (tpl) {
        setSelectedKey(v);
        setPaymentTerms({ preset: 'custom', installments: tpl.installments.map((i) => ({ ...i })) });
      }
      return;
    }
    const p = presetById(v as PaymentPreset);
    setSelectedKey(p.id);
    setPaymentTerms({ preset: p.id, installments: p.installments.map((i) => ({ ...i })) });
  };

  const startEdit = (tpl: CustomPaymentTemplate) => {
    setDraft({ ...tpl, installments: tpl.installments.map((i) => ({ ...i })) });
    setIsNewTemplate(false);
    setEditingTplId(tpl.id);
  };

  const cancelEdit = () => {
    if (isNewTemplate) {
      const fallback = templates[0] ? `tpl:${templates[0].id}` : '100_end';
      if (fallback === '100_end') {
        const p = presetById('100_end');
        setPaymentTerms({ preset: p.id, installments: p.installments });
      } else {
        const t = templates[0]!;
        setPaymentTerms({ preset: 'custom', installments: t.installments.map((i) => ({ ...i })) });
      }
      setSelectedKey(fallback);
    }
    setDraft(null);
    setEditingTplId(null);
    setIsNewTemplate(false);
  };

  const saveDraft = async () => {
    if (!draft) return;
    if (!draft.name.trim()) return toast.error('Indique um nome para o modelo.');
    const nameTaken = templates.some(
      (t) => t.id !== draft.id && t.name.trim().toLowerCase() === draft.name.trim().toLowerCase(),
    );
    if (nameTaken) return toast.error('Já existe um modelo com esse nome.');
    if (totalPercent({ preset: 'custom', installments: draft.installments }) !== 100) {
      return toast.error('Soma das percentagens deve ser 100%.');
    }
    const cleaned: CustomPaymentTemplate = { ...draft, name: draft.name.trim() };
    const next = isNewTemplate
      ? [...templates, cleaned]
      : templates.map((t) => (t.id === cleaned.id ? cleaned : t));
    const nextTerms: PaymentTerms = { preset: 'custom', installments: cleaned.installments.map((i) => ({ ...i })) };
    setSaving(true);
    const ok = await persistPaymentSettings(next, nextTerms, validityDays);
    setSaving(false);
    if (!ok) return;
    setTemplates(next);
    setPaymentTerms(nextTerms);
    setSelectedKey(`tpl:${cleaned.id}`);
    setDraft(null);
    setEditingTplId(null);
    setIsNewTemplate(false);
    toast.success(isNewTemplate ? 'Modelo adicionado.' : 'Modelo atualizado.');
  };

  const confirmDelete = async () => {
    if (!deleteTplId) return;
    const next = templates.filter((t) => t.id !== deleteTplId);
    const fallback = presetById('100_end');
    const nextTerms: PaymentTerms = { preset: fallback.id, installments: fallback.installments.map((i) => ({ ...i })) };
    const ok = await persistPaymentSettings(next, nextTerms, validityDays);
    if (!ok) return;
    setTemplates(next);
    setPaymentTerms(nextTerms);
    setSelectedKey('100_end');
    setDeleteTplId(null);
    if (editingTplId === deleteTplId) {
      setDraft(null);
      setEditingTplId(null);
      setIsNewTemplate(false);
    }
    toast.success('Modelo eliminado.');
  };

  const saveValidity = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('app_user_settings')
      .upsert({ user_id: user.id, quote_validity_days: validityDays } as any, { onConflict: 'user_id' });
    setSaving(false);
    if (error) return toast.error('Erro a guardar.');
    toast.success('Validade atualizada.');
  };

  const previewSource: PaymentTerms = draft
    ? { preset: 'custom', installments: draft.installments }
    : paymentTerms;

  const paymentCard = (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <SectionHeader
          icon={Wallet}
          title="Formatos de pagamento"
          description="Aplicado automaticamente aos novos orçamentos. Pode ser alterado em cada orçamento."
        />

        <div>
          <Label>Modelo</Label>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-[220px]">
              <MobileSheetSelect
                value={selectedKey}
                onChange={onSelectChange}
                disabled={editing}
                title="Formato de pagamento"
                options={[
                  ...templates.map<SheetSelectOption>((t) => ({
                    value: `tpl:${t.id}`,
                    label: t.name,
                  })),
                  ...builtInPresets.map<SheetSelectOption>((p, i) => ({
                    value: p.id,
                    label: p.label,
                    dividerBefore: i === 0 && templates.length > 0,
                  })),
                  {
                    value: '__new',
                    label: '+ Novo modelo personalizado',
                    primary: true,
                    dividerBefore: true,
                  },
                ]}
              />
            </div>
            {selectedTpl && !editing && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-initial" onClick={() => startEdit(selectedTpl)}>
                  <Pencil className="h-4 w-4" /> Editar formato
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive shrink-0"
                  onClick={() => setDeleteTplId(selectedTpl.id)}
                  aria-label="Eliminar formato"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden min-[420px]:inline">Eliminar formato</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {editing && draft && (
          <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <div>
              <Label className="text-xs">Nome do modelo</Label>
              <Input
                value={draft.name}
                placeholder="Ex.: 30% adiantamento + 70% à entrega"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              {draft.installments.map((i, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_5rem_7rem_2rem] gap-2 items-end">
                  <div>
                    {idx === 0 && <Label className="text-xs">Descrição</Label>}
                    <Input value={i.label} onChange={(e) => {
                      const next = [...draft.installments];
                      next[idx] = { ...next[idx], label: e.target.value };
                      setDraft({ ...draft, installments: next });
                    }} />
                  </div>
                  <div>
                    {idx === 0 && <Label className="text-xs">%</Label>}
                    <Input type="number" min={0} max={100} value={i.percent} onChange={(e) => {
                      const next = [...draft.installments];
                      next[idx] = { ...next[idx], percent: Number(e.target.value) };
                      setDraft({ ...draft, installments: next });
                    }} />
                  </div>
                  <div>
                    {idx === 0 && <Label className="text-xs">Dias após aceitação</Label>}
                    <Input type="number" min={0} value={i.due_offset_days} onChange={(e) => {
                      const next = [...draft.installments];
                      next[idx] = { ...next[idx], due_offset_days: Number(e.target.value) };
                      setDraft({ ...draft, installments: next });
                    }} />
                  </div>
                  <div className="flex justify-end">
                    {draft.installments.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => {
                        const next = draft.installments.filter((_, n) => n !== idx);
                        setDraft({ ...draft, installments: next });
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                setDraft({
                  ...draft,
                  installments: [...draft.installments, { label: `Parcela ${draft.installments.length + 1}`, percent: 0, due_offset_days: 30 }],
                });
              }}>
                <Plus className="h-4 w-4" /> Adicionar parcela
              </Button>
              {totalPercent({ preset: 'custom', installments: draft.installments }) !== 100 && (
                <p className="text-xs text-destructive">
                  Soma das percentagens: {totalPercent({ preset: 'custom', installments: draft.installments })}% (deve ser 100%).
                </p>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Pré-visualização (exemplo {fmt(previewTotal)} — {todayStr})
          </div>
          <div className="space-y-1">
            {expandInstallments(previewSource, previewTotal, new Date()).map((p, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_6rem] items-center gap-3 text-sm">
                <span className="truncate">
                  {p.label} <span className="text-muted-foreground">({p.percent}%)</span>
                </span>
                <span className="font-semibold text-accent text-right">{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {editing && (
          <div className="pt-2 flex flex-wrap gap-2">
            <Button onClick={saveDraft} disabled={saving || !draftValid} size="sm">
              {saving ? 'A guardar...' : isNewTemplate ? 'Adicionar formato' : 'Guardar alterações'}
            </Button>
            <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
              Cancelar
            </Button>
          </div>
        )}

        {/* Validity moved inside payment card */}
        <div className="border-t border-border pt-4 space-y-2">
          <Label>Validade do orçamento (dias)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={365}
              value={validityDays}
              onChange={(e) =>
                setValidityDays(Math.min(365, Math.max(1, Number(e.target.value) || 30)))
              }
              className="max-w-[140px]"
            />
            <Button onClick={saveValidity} disabled={saving} size="sm" variant="outline">
              Guardar
            </Button>
          </div>
        </div>
      </CardContent>

      <AlertDialog open={!!deleteTplId} onOpenChange={(o) => !o && setDeleteTplId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar formato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O modelo será removido da lista de formatos personalizados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );

  // ============ Terms card ============
  const selectedTermsTpl = selectedTermsKey.startsWith('ttpl:')
    ? termsTemplates.find((t) => t.id === selectedTermsKey.slice(5)) ?? null
    : null;
  const editingTerms = termsDraft !== null;
  const termsDraftValid = !!termsDraft && termsDraft.name.trim().length > 0;

  const onTermsSelectChange = (v: string) => {
    if (editingTerms) return;
    if (v === '__new') {
      const tpl: TermsTemplate = { ...createEmptyTermsTemplate('Novo modelo'), content: DEFAULT_TERMS_CONTENT };
      setTermsDraft(tpl);
      setIsNewTermsTpl(true);
      setSelectedTermsKey(`ttpl:${tpl.id}`);
      return;
    }
    if (v.startsWith('ttpl:')) {
      setSelectedTermsKey(v);
    }
  };

  const startEditTerms = (tpl: TermsTemplate) => {
    setTermsDraft({ ...tpl });
    setIsNewTermsTpl(false);
  };

  const cancelEditTerms = () => {
    if (isNewTermsTpl) {
      setSelectedTermsKey(termsTemplates[0] ? `ttpl:${termsTemplates[0].id}` : '');
    }
    setTermsDraft(null);
    setIsNewTermsTpl(false);
  };

  const saveTermsDraft = async () => {
    if (!termsDraft) return;
    if (!termsDraft.name.trim()) return toast.error('Indique um nome para o modelo.');
    const nameTaken = termsTemplates.some(
      (t) => t.id !== termsDraft.id && t.name.trim().toLowerCase() === termsDraft.name.trim().toLowerCase(),
    );
    if (nameTaken) return toast.error('Já existe um modelo com esse nome.');
    const cleaned: TermsTemplate = { ...termsDraft, name: termsDraft.name.trim() };
    const next = isNewTermsTpl
      ? [...termsTemplates, cleaned]
      : termsTemplates.map((t) => (t.id === cleaned.id ? cleaned : t));
    setSaving(true);
    const ok = await persistTermsTemplates(next);
    setSaving(false);
    if (!ok) return;
    setTermsTemplates(next);
    setSelectedTermsKey(`ttpl:${cleaned.id}`);
    setTermsDraft(null);
    setIsNewTermsTpl(false);
    toast.success(isNewTermsTpl ? 'Modelo adicionado.' : 'Modelo atualizado.');
  };

  const confirmDeleteTerms = async () => {
    if (!deleteTermsTplId) return;
    const next = termsTemplates.filter((t) => t.id !== deleteTermsTplId);
    const ok = await persistTermsTemplates(next);
    if (!ok) return;
    setTermsTemplates(next);
    setSelectedTermsKey(next[0] ? `ttpl:${next[0].id}` : '');
    setDeleteTermsTplId(null);
    if (termsDraft?.id === deleteTermsTplId) {
      setTermsDraft(null);
      setIsNewTermsTpl(false);
    }
    toast.success('Modelo eliminado.');
  };

  const previewTermsContent = termsDraft ? termsDraft.content : (selectedTermsTpl?.content ?? '');

  const termsCard = (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <SectionHeader
          icon={FileText}
          title="Termos e Condições"
          description="Aplicado automaticamente aos novos orçamentos. Pode ser alterado em cada orçamento."
        />

        <div>
          <Label>Modelo</Label>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-[220px]">
              <MobileSheetSelect
                value={selectedTermsKey}
                onChange={onTermsSelectChange}
                disabled={editingTerms}
                placeholder="Selecione ou crie um modelo"
                title="Termos e condições"
                options={[
                  ...termsTemplates.map<SheetSelectOption>((t) => ({
                    value: `ttpl:${t.id}`,
                    label: t.name,
                  })),
                  {
                    value: '__new',
                    label: '+ Novo modelo',
                    primary: true,
                    dividerBefore: termsTemplates.length > 0,
                  },
                ]}
              />
            </div>
            {selectedTermsTpl && !editingTerms && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-initial" onClick={() => startEditTerms(selectedTermsTpl)}>
                  <Pencil className="h-4 w-4" /> Editar formato
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive shrink-0"
                  onClick={() => setDeleteTermsTplId(selectedTermsTpl.id)}
                  aria-label="Eliminar formato"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden min-[420px]:inline">Eliminar formato</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {editingTerms && termsDraft && (
          <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <div>
              <Label className="text-xs">Nome do modelo</Label>
              <Input
                value={termsDraft.name}
                placeholder="Ex.: Termos padrão"
                onChange={(e) => setTermsDraft({ ...termsDraft, name: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Conteúdo</Label>
              <Textarea
                value={termsDraft.content}
                onChange={(e) => setTermsDraft({ ...termsDraft, content: e.target.value.slice(0, 5000) })}
                rows={6}
                placeholder="Ex: Os preços são válidos por 30 dias..."
              />
              <p className="text-xs text-muted-foreground text-right">{termsDraft.content.length}/5000</p>
            </div>
          </div>
        )}

        {!editingTerms && previewTermsContent && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{previewTermsContent}</pre>
          </div>
        )}

        {editingTerms && (
          <div className="pt-2 flex flex-wrap gap-2">
            <Button onClick={saveTermsDraft} disabled={saving || !termsDraftValid} size="sm">
              {saving ? 'A guardar...' : isNewTermsTpl ? 'Adicionar formato' : 'Guardar alterações'}
            </Button>
            <Button variant="ghost" size="sm" onClick={cancelEditTerms} disabled={saving}>
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deleteTermsTplId} onOpenChange={(o) => !o && setDeleteTermsTplId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar formato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O modelo será removido da lista de termos guardados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTerms}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );

  // ============ Brand (logo + colors) card ============
  const brandCard = (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <SectionHeader icon={Type} title="Logotipo da empresa" />

        <div className="flex items-center gap-5">
          <div className="h-24 w-24 rounded-xl border border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onLogoChange} />
            <Button variant="outline" size="sm" onClick={onPickLogo} disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {logoUrl ? 'Substituir' : 'Carregar logo'}
            </Button>
            {logoUrl && (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-2" onClick={removeLogo}>
                <Trash2 className="h-4 w-4" /> Remover
              </Button>
            )}
            <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Até 5MB.</p>
          </div>
        </div>

        <div className="border-t border-border pt-6 space-y-3">
          <Label className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
            Cores da empresa
          </Label>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Cor principal</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorPrimary}
                  onChange={(e) => setColorPrimary(e.target.value)}
                  className="h-10 w-14 rounded border border-input cursor-pointer"
                />
                <Input value={colorPrimary} onChange={(e) => setColorPrimary(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Cor de destaque</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorAccent}
                  onChange={(e) => setColorAccent(e.target.value)}
                  className="h-10 w-14 rounded border border-input cursor-pointer"
                />
                <Input value={colorAccent} onChange={(e) => setColorAccent(e.target.value)} className="flex-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <Button
            onClick={saveBrand}
            disabled={saving}
            className="w-full bg-foreground hover:bg-foreground/90 text-background"
          >
            {saving ? 'A guardar...' : 'Guardar marca'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-3xl font-bold">Definições</h1>
        <p className="text-muted-foreground">
          Dados da empresa e identidade que aparecem nos orçamentos enviados aos clientes.
        </p>
      </div>

      {companyCard}
      {paymentCard}
      {termsCard}

      {isPro ? (
        brandCard
      ) : (
        <FeatureGate
          feature="pdfBranding"
          mode="overlay"
          title="Marca personalizada"
          description="Disponível no plano Pro."
        >
          {brandCard}
        </FeatureGate>
      )}
    </div>
  );
}
