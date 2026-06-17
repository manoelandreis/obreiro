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
import { Upload, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

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
          'logo_url, brand_color_primary, brand_color_accent, company_description, company_terms, payment_conditions, quote_validity_days, company_name, company_nif, company_email, company_phone, company_address'
        )
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setLogoUrl(data.logo_url ?? null);
        if (data.logo_url) setLogoPreview(await loadSignedUrl(data.logo_url));
        setColorPrimary(data.brand_color_primary ?? '#1B3A5C');
        setColorAccent(data.brand_color_accent ?? '#E8730A');
        setDescription(data.company_description ?? '');
        setTerms(data.company_terms ?? '');
        setPaymentConditions(data.payment_conditions ?? '');
        setValidityDays(data.quote_validity_days ?? 30);
        setCompanyName((data as any).company_name ?? '');
        setCompanyNif((data as any).company_nif ?? '');
        setCompanyEmail((data as any).company_email ?? '');
        setCompanyPhone((data as any).company_phone ?? '');
        setCompanyAddress((data as any).company_address ?? '');
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
    setSaving(true);
    const { error } = await supabase
      .from('app_user_settings')
      .upsert(
        {
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
        },
        { onConflict: 'user_id' }
      );
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

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-3xl font-bold">Marca da empresa</h1>
        <p className="text-muted-foreground">
          A sua identidade aparece em todos os orçamentos enviados aos clientes.
        </p>
      </div>

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
