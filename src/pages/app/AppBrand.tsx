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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image as ImageIcon, Trash2, Loader2, Wallet, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  DEFAULT_PAYMENT_TERMS,
  PAYMENT_PRESETS,
  PaymentPreset,
  PaymentTerms,
  PaymentInstallment,
  SavedPaymentPreset,
  expandInstallments,
  presetById,
  totalPercent,
} from '@/lib/paymentTerms';
import { PaymentPresetCard, CreatePresetCard } from '@/components/app/PaymentPresetCard';

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const fmt = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);


export default function AppBrand() {
  const { user } = useAppAuth();
  const { isPro } = useSubscription();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [colorPrimary, setColorPrimary] = useState('#1B3A5C');
  const [colorAccent, setColorAccent] = useState('#E8730A');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('');
  const [paymentConditions, setPaymentConditions] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  // Company data
  const [companyName, setCompanyName] = useState('');
  const [companyNif, setCompanyNif] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(DEFAULT_PAYMENT_TERMS);
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
          'logo_url, brand_color_primary, brand_color_accent, company_description, company_terms, payment_conditions, quote_validity_days, company_name, company_nif, company_email, company_phone, company_address, default_payment_terms' as any
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
        setTerms(d.company_terms ?? '');
        setPaymentConditions(d.payment_conditions ?? '');
        setValidityDays(d.quote_validity_days ?? 30);
        setCompanyName(d.company_name ?? '');
        setCompanyNif(d.company_nif ?? '');
        setCompanyEmail(d.company_email ?? '');
        setCompanyPhone(d.company_phone ?? '');
        setCompanyAddress(d.company_address ?? '');
        if (d.default_payment_terms) setPaymentTerms(d.default_payment_terms as PaymentTerms);
      }
      setLoading(false);
    })();
  }, [user]);

  const onPickLogo = () => fileRef.current?.click();

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      return toast.error('Selecione uma imagem.');
    }
    if (file.size > MAX_LOGO_BYTES) {
      return toast.error('Logo até 5MB.');
    }
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
    // Delete old logo
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

  const save = async () => {
    if (!user) return;
    if (paymentTerms.preset === 'custom' && totalPercent(paymentTerms) !== 100) {
      return toast.error('Soma das percentagens deve ser 100%.');
    }
    setSaving(true);
    const payload: any = {
      user_id: user.id,
      logo_url: logoUrl,
      brand_color_primary: colorPrimary,
      brand_color_accent: colorAccent,
      company_description: description.trim() || null,
      company_terms: terms.trim() || null,
      payment_conditions: paymentConditions.trim() || null,
      quote_validity_days: validityDays,
      company_name: companyName.trim() || null,
      company_nif: companyNif.trim() || null,
      company_email: companyEmail.trim() || null,
      company_phone: companyPhone.trim() || null,
      company_address: companyAddress.trim() || null,
      default_payment_terms: paymentTerms,
    };
    const { error } = await supabase
      .from('app_user_settings')
      .upsert(payload, { onConflict: 'user_id' });
    setSaving(false);
    if (error) return toast.error('Erro a guardar.');
    toast.success('Definições atualizadas.');
  };


  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar...
      </div>
    );
  }

  const inner = (
    <Card>
      <CardContent className="pt-6 space-y-8">
        {/* Logo */}
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
            Logótipo
          </Label>
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 rounded-xl border border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={onLogoChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={onPickLogo}
                disabled={uploading}
                className="gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {logoUrl ? 'Substituir' : 'Carregar logo'}
              </Button>
              {logoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive gap-2"
                  onClick={removeLogo}
                >
                  <Trash2 className="h-4 w-4" /> Remover
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Até 5MB.</p>
            </div>
          </div>
        </div>

        {/* Colors */}
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
                <Input
                  value={colorPrimary}
                  onChange={(e) => setColorPrimary(e.target.value)}
                  className="flex-1"
                />
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
                <Input
                  value={colorAccent}
                  onChange={(e) => setColorAccent(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="border-t border-border pt-6 space-y-2">
          <Label>Descrição / história da empresa</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
            rows={4}
            placeholder="Ex: A Silva Construções é uma empresa familiar com 20 anos de experiência..."
          />
          <p className="text-xs text-muted-foreground text-right">
            {description.length}/2000
          </p>
        </div>

        {/* T&Cs */}
        <div className="border-t border-border pt-6 space-y-2">
          <Label>Termos e condições (rodapé do orçamento)</Label>
          <Textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value.slice(0, 5000))}
            rows={5}
            placeholder="Ex: Os valores apresentados são válidos por X dias. Garantia de 1 ano em todos os trabalhos..."
          />
          <p className="text-xs text-muted-foreground text-right">
            {terms.length}/5000
          </p>
        </div>

        {/* Payment conditions */}
        <div className="border-t border-border pt-6 space-y-2">
          <Label>Condições de pagamento</Label>
          <Textarea
            value={paymentConditions}
            onChange={(e) => setPaymentConditions(e.target.value.slice(0, 2000))}
            rows={3}
            placeholder="Ex: 30% à adjudicação, 40% no início dos trabalhos, 30% na conclusão."
          />
        </div>

        {/* Validity */}
        <div className="border-t border-border pt-6 space-y-2">
          <Label>Validade do orçamento (dias)</Label>
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
        </div>

        <div className="border-t border-border pt-6">
          <Button
            onClick={save}
            disabled={saving}
            className="w-full bg-foreground hover:bg-foreground/90 text-background"
          >
            {saving ? 'A guardar...' : 'Guardar marca'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const companyCard = (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Dados da Empresa</div>
        <p className="text-sm text-muted-foreground -mt-2">Estes dados aparecem automaticamente em todos os orçamentos que criar.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Nome da empresa</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex: Silva Construções" />
          </div>
          <div>
            <Label>NIF</Label>
            <Input value={companyNif} onChange={(e) => setCompanyNif(e.target.value)} placeholder="Ex: 123456789" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Morada</Label>
          <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
        </div>
        <div className="pt-2">
          <Button onClick={save} disabled={saving} size="sm">
            {saving ? 'A guardar...' : 'Guardar dados'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const previewTotal = 1000;
  const paymentCard = (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Formato de pagamento por defeito</div>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">Aplicado automaticamente aos novos orçamentos. Pode ser alterado em cada orçamento.</p>

        <div>
          <Label>Modelo</Label>
          <Select
            value={paymentTerms.preset}
            onValueChange={(v) => {
              const p = presetById(v as PaymentPreset);
              setPaymentTerms({ preset: p.id, installments: p.installments.map((i) => ({ ...i })) });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {paymentTerms.preset === 'custom' && (
          <div className="space-y-2">
            {paymentTerms.installments.map((i, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5"><Label className="text-xs">Descrição</Label>
                  <Input value={i.label} onChange={(e) => {
                    const next = [...paymentTerms.installments];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setPaymentTerms({ ...paymentTerms, installments: next });
                  }} />
                </div>
                <div className="col-span-3"><Label className="text-xs">%</Label>
                  <Input type="number" min={0} max={100} value={i.percent} onChange={(e) => {
                    const next = [...paymentTerms.installments];
                    next[idx] = { ...next[idx], percent: Number(e.target.value) };
                    setPaymentTerms({ ...paymentTerms, installments: next });
                  }} />
                </div>
                <div className="col-span-3"><Label className="text-xs">Dias após aceitação</Label>
                  <Input type="number" min={0} value={i.due_offset_days} onChange={(e) => {
                    const next = [...paymentTerms.installments];
                    next[idx] = { ...next[idx], due_offset_days: Number(e.target.value) };
                    setPaymentTerms({ ...paymentTerms, installments: next });
                  }} />
                </div>
                <div className="col-span-1 flex justify-end">
                  {paymentTerms.installments.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => {
                      const next = paymentTerms.installments.filter((_, n) => n !== idx);
                      setPaymentTerms({ ...paymentTerms, installments: next });
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              setPaymentTerms({
                ...paymentTerms,
                installments: [...paymentTerms.installments, { label: `Parcela ${paymentTerms.installments.length + 1}`, percent: 0, due_offset_days: 30 }],
              });
            }}>
              <Plus className="h-4 w-4" /> Adicionar parcela
            </Button>
            {totalPercent(paymentTerms) !== 100 && (
              <p className="text-xs text-destructive">Soma das percentagens: {totalPercent(paymentTerms)}% (deve ser 100%).</p>
            )}
          </div>
        )}

        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Pré-visualização (exemplo {fmt(previewTotal)})</div>
          <div className="space-y-1">
            {expandInstallments(paymentTerms, previewTotal, new Date()).map((p, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm gap-2">
                <span>{p.label} <span className="text-muted-foreground">({p.percent}%)</span></span>
                <span className="text-muted-foreground text-xs">vence {p.dueDate.toLocaleDateString('pt-PT')}</span>
                <span className="font-semibold text-accent w-24 text-right">{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={save} disabled={saving} size="sm">
            {saving ? 'A guardar...' : 'Guardar formato'}
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


      {isPro ? (
        inner
      ) : (
        <FeatureGate
          feature="pdfBranding"
          mode="overlay"
          title="Marca personalizada"
          description="Disponível no plano Pro."
        >
          {inner}
        </FeatureGate>
      )}
    </div>
  );
}
