import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { StatusBadge } from '@/components/app/QuoteStatusBadge';
import { QuoteAttachments } from '@/components/app/QuoteAttachments';
import { QuoteWorkView } from '@/components/app/QuoteWorkView';
import { FeatureGate } from '@/components/app/FeatureGate';
import {
  ArrowLeft, Download, Mail, Copy, History, Sparkles, Loader2, ExternalLink,
  ChevronDown, Eye, EyeOff, MessageCircle, ImagePlus, Check, MoreHorizontal, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { buildQuoteHtml, loadBrand, openPrintWindow, type QuoteRenderData } from '@/lib/quotePdf';

import { type PaymentTerms, DEFAULT_PAYMENT_TERMS } from '@/lib/paymentTerms';

type Status = 'rascunho' | 'enviado' | 'visto' | 'aceite' | 'rejeitado' | 'expirado';

interface QuoteRow {
  id: string;
  title: string;
  status: Status;
  public_token: string;
  company_snapshot: any;
  client_snapshot: any;
  services: any;
  notes: string | null;
  subtotal: number;
  iva: number;
  total: number;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  expires_at: string | null;
  client_message: string | null;
  payment_terms: PaymentTerms | null;
}

interface HistoryRow { id: string; status: string; source: string; note: string | null; created_at: string }

const daysSince = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

export default function AppQuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppAuth();
  const { isPro, limits } = useSubscription();

  const [quote, setQuote] = useState<QuoteRow | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState<PaymentTerms | null>(null);

  const publicUrl = useMemo(
    () => (quote ? `${window.location.origin}/q/${quote.public_token}` : ''),
    [quote]
  );

  const clientPhone: string | undefined = (quote?.client_snapshot as any)?.phone;
  const hasPhone = Boolean(clientPhone && String(clientPhone).replace(/\D/g, '').length >= 6);

  const load = async () => {
    if (!id || !user) return;
    setLoading(true);
    const [{ data: q }, { data: h }] = await Promise.all([
      supabase.from('app_quotes').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('quote_status_history')
        .select('id, status, source, note, created_at')
        .eq('quote_id', id)
        .order('created_at', { ascending: false }),
    ]);
    if (q) {
      setQuote(q as any);
      setRecipient((q.client_snapshot as any)?.email ?? '');
    }
    if (h) setHistory(h as any);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // Load user's default payment terms (used as fallback for older quotes)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('app_user_settings')
        .select('default_payment_terms' as any)
        .eq('user_id', user.id)
        .maybeSingle();
      const dpt = (data as any)?.default_payment_terms as PaymentTerms | null | undefined;
      setDefaultPaymentTerms(dpt ?? DEFAULT_PAYMENT_TERMS);
    })();
  }, [user]);

  const setExpiry = async () => {
    if (!quote) return;
    if (quote.expires_at) return;
    const { data: settings } = await supabase
      .from('app_user_settings')
      .select('quote_validity_days')
      .eq('user_id', user!.id)
      .maybeSingle();
    const days = settings?.quote_validity_days ?? 30;
    const d = new Date();
    d.setDate(d.getDate() + days);
    await supabase
      .from('app_quotes')
      .update({ expires_at: d.toISOString().slice(0, 10) })
      .eq('id', quote.id);
  };

  const buildHtml = async (inline = false): Promise<string | null> => {
    if (!quote || !user) return null;
    const brand = await loadBrand(user.id, isPro);
    const cs = quote.company_snapshot || {};
    const cl = quote.client_snapshot || {};

    let attachmentUrls: { url: string; caption: string | null }[] = [];
    if (limits.attachments) {
      const { data: atts } = await supabase
        .from('quote_attachments')
        .select('storage_path, caption')
        .eq('quote_id', quote.id)
        .order('sort_order');
      if (atts) {
        attachmentUrls = await Promise.all(
          atts.map(async (a) => {
            const { data: sig } = await supabase.storage
              .from('quote-attachments')
              .createSignedUrl(a.storage_path, 60 * 60);
            return { url: sig?.signedUrl ?? '', caption: a.caption };
          })
        );
        attachmentUrls = attachmentUrls.filter((a) => a.url);
      }
    }

    const data: QuoteRenderData = {
      title: quote.title,
      company: {
        name: cs.name ?? cs.company_name,
        nif: cs.nif ?? cs.company_nif,
        email: cs.email ?? cs.company_email,
        phone: cs.phone ?? cs.company_phone,
        address: cs.address ?? cs.company_address,
      },
      client: { name: cl.name, email: cl.email, phone: cl.phone, address: cl.address },
      services: quote.services || [],
      notes: quote.notes,
      subtotal: Number(quote.subtotal),
      iva: Number(quote.iva),
      total: Number(quote.total),
      createdAt: quote.created_at,
      expiresAt: quote.expires_at,
      status: quote.status,
      paymentTerms: quote.payment_terms ?? defaultPaymentTerms ?? null,
      paymentAnchor: quote.responded_at ?? quote.sent_at ?? quote.created_at,
    };
    return buildQuoteHtml(data, {
      brand,
      withWatermark: !limits.removeWatermark,
      attachmentUrls,
      hideTotals: inline,
    });
  };

  const handleDownload = async () => {
    setGenerating(true);
    const html = await buildHtml(false);
    setGenerating(false);
    if (!html) return toast.error('Não foi possível gerar o PDF.');
    if (!openPrintWindow(html)) toast.error('Pop-up bloqueado.');
  };

  const recordSent = async (channel: 'email' | 'whatsapp') => {
    if (!quote || !user) return;
    await setExpiry();
    if (quote.status === 'rascunho') {
      await supabase
        .from('app_quotes')
        .update({ status: 'enviado', sent_at: new Date().toISOString() })
        .eq('id', quote.id);
      await supabase.from('quote_status_history').insert({
        quote_id: quote.id,
        user_id: user.id,
        status: 'enviado',
        source: 'owner',
        note: `Enviado por ${channel === 'email' ? 'email' : 'WhatsApp'}`,
      });
    }
    await load();
  };

  const handleSendByEmail = async () => {
    if (!recipient) return toast.error('Insira um email.');
    if (!quote) return;
    await recordSent('email');
    const subject = encodeURIComponent(`${quote.title} — ${(quote.company_snapshot as any)?.name || ''}`);
    const body = encodeURIComponent(
      `${messageBody || `Olá,\n\nSegue em anexo o orçamento solicitado.`}\n\n` +
      `Pode ver e responder ao orçamento aqui:\n${publicUrl}\n\n` +
      `Obrigado.`
    );
    window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${subject}&body=${body}`;
    setSendOpen(false);
    toast.success('Email preparado. O seu cliente de email irá abrir.');
  };

  const handleSendByWhatsApp = async () => {
    if (!quote) return;
    if (!hasPhone) return toast.error('Cliente sem telefone preenchido.');
    const phone = String(clientPhone).replace(/\D/g, '');
    const clientName = (quote.client_snapshot as any)?.name ?? '';
    const companyName = (quote.company_snapshot as any)?.name ?? '';
    const text = encodeURIComponent(
      `Olá${clientName ? ` ${clientName}` : ''},\n\n` +
      `Segue o orçamento «${quote.title}»${companyName ? ` da ${companyName}` : ''}.\n` +
      `Pode ver e responder aqui: ${publicUrl}\n\n` +
      `Obrigado.`
    );
    await recordSent('whatsapp');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    toast.success('WhatsApp aberto.');
  };

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    toast.success('Link copiado.');
  };

  const updateStatus = async (status: Status) => {
    if (!quote || !user) return;
    await supabase.from('app_quotes').update({ status }).eq('id', quote.id);
    await supabase.from('quote_status_history').insert({
      quote_id: quote.id,
      user_id: user.id,
      status,
      source: 'owner',
    });
    toast.success('Estado atualizado.');
    await load();
  };

  if (loading || !quote) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar...
      </div>
    );
  }

  const cl = quote.client_snapshot || {};

  // View indicator text (subtle)
  const viewIndicator = (() => {
    if (!limits.tracking) return null;
    if (quote.status === 'rascunho') return null;
    if (quote.viewed_at) {
      const d = daysSince(quote.viewed_at);
      return d === 0 ? 'Visto hoje' : `Visto há ${d} ${d === 1 ? 'dia' : 'dias'}`;
    }
    return 'Ainda não visualizado';
  })();

  const euroFmt = (v: number) =>
    Number(v).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  return (
    <div className="space-y-6 max-w-5xl pb-32">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/quotes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl font-bold truncate">{quote.title}</h1>

              {/* Compact status selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md hover:bg-muted/60 px-1 -mx-1 py-0.5 transition-colors"
                    aria-label="Alterar estado"
                  >
                    <StatusBadge status={quote.status} />
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Automático: Enviado / Visto
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs">Marcar manualmente</DropdownMenuLabel>
                  {(['rascunho', 'aceite', 'rejeitado', 'expirado'] as const).map((s) => (
                    <DropdownMenuItem key={s} onClick={() => updateStatus(s)} className="gap-2">
                      {quote.status === s && <Check className="h-3.5 w-3.5" />}
                      <span className={quote.status === s ? 'font-medium' : ''}>
                        {s === 'rascunho' ? 'Rascunho' : s === 'aceite' ? 'Aceite' : s === 'rejeitado' ? 'Rejeitado' : 'Expirado'}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {viewIndicator && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {quote.viewed_at ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {viewIndicator}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Criado em {new Date(quote.created_at).toLocaleDateString('pt-PT')}
              {cl.name ? ` · ${cl.name}` : ''}
              {quote.expires_at
                ? ` · Válido até ${new Date(quote.expires_at).toLocaleDateString('pt-PT')}`
                : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Work view */}
      <QuoteWorkView
        quoteId={quote.id}
        services={(quote.services as any) || []}
        client={{ name: cl.name, email: cl.email, phone: cl.phone }}
        subtotal={Number(quote.subtotal)}
        iva={Number(quote.iva)}
        notes={quote.notes}
        paymentTerms={quote.payment_terms ?? defaultPaymentTerms}
        paymentAnchor={quote.responded_at ?? quote.sent_at ?? quote.created_at}
        onClientUpdated={load}
      />

      {/* Attachments (collapsed by default) */}
      <Collapsible open={showAttachments} onOpenChange={setShowAttachments}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ImagePlus className="h-4 w-4" />
            {showAttachments ? 'Ocultar fotos' : 'Adicionar fotos (opcional)'}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAttachments ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <Card>
            <CardContent className="pt-6">
              {limits.attachments ? (
                <QuoteAttachments quoteId={quote.id} />
              ) : (
                <FeatureGate
                  feature="attachments"
                  title="Galeria de fotos e anexos"
                  description="Adicione fotos antes/depois, referências e documentos. Disponível no plano Pro."
                >
                  <div />
                </FeatureGate>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* History */}
      {limits.tracking && history.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-3">
              <History className="h-3.5 w-3.5" /> Histórico
            </div>
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-3 text-sm">
                  <StatusBadge status={h.status as any} />
                  <span className="text-muted-foreground">
                    {h.source === 'client' ? 'pelo cliente' : 'por si'}
                  </span>
                  {h.note && <span className="text-muted-foreground text-xs">· {h.note}</span>}
                  <span className="text-muted-foreground ml-auto">
                    {new Date(h.created_at).toLocaleString('pt-PT')}
                  </span>
                </li>
              ))}
            </ul>
            {quote.client_message && (
              <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  Mensagem do cliente:
                </div>
                <div className="whitespace-pre-wrap">{quote.client_message}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isPro && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold">PDF com a sua marca</div>
              <p className="text-sm text-muted-foreground">
                No plano Free o PDF leva uma pequena marca Obreiro. Faça upgrade para Pro para
                personalizar com o seu logo, cores, T&Cs e galeria de fotos.
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/app/planos')}>
              Ver planos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Send dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar orçamento por email</DialogTitle>
            <DialogDescription>
              Abrimos o seu cliente de email com o link público do orçamento já incluído.
              O cliente pode visualizar, aceitar ou rejeitar diretamente no navegador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Email do cliente</Label>
              <Input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="cliente@exemplo.com"
              />
            </div>
            <div>
              <Label>Mensagem (opcional)</Label>
              <Textarea
                rows={4}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Olá, segue o orçamento que falámos..."
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
              <span className="text-muted-foreground truncate">{publicUrl}</span>
              <Button variant="ghost" size="sm" onClick={copyLink} className="gap-1 h-7">
                <Copy className="h-3.5 w-3.5" /> Copiar
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendByEmail} className="gap-2">
              <Mail className="h-4 w-4" /> Abrir email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating action bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.15)]">
        <div className="mx-auto max-w-5xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Total */}
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Total (c/ IVA)</span>
            <span className="font-heading text-xl sm:text-2xl font-bold text-accent">
              {euroFmt(Number(quote.total))}
            </span>
          </div>

          <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
            {/* Mobile layout: menu + Download + WhatsApp (full-width) */}
            <div className="flex items-center gap-2 w-full sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Mais ações" className="h-10 w-10 shrink-0">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="gap-2">
                      <ExternalLink className="h-4 w-4" /> Ver como o cliente vê
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyLink} className="gap-2">
                    <Copy className="h-4 w-4" /> Copiar link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSendOpen(true)} className="gap-2">
                    <Mail className="h-4 w-4" /> Enviar por email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Edição em breve.')} className="gap-2">
                    <Pencil className="h-4 w-4" /> Editar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={generating}
                className="flex-1 h-10 gap-2"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Descarregar
              </Button>

              <Button
                onClick={handleSendByWhatsApp}
                disabled={!hasPhone}
                className="flex-1 h-10 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                title={hasPhone ? 'Enviar por WhatsApp' : 'Cliente sem telefone preenchido'}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>

            {/* Desktop / tablet layout: Mais ações + PDF + Email + WhatsApp */}
            <div className="hidden sm:flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10.10 gap-1.5" aria-label="Mais ações">
                    <MoreHorizontal className="h-4 w-4" />
                    Mais ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="gap-2">
                      <ExternalLink className="h-4 w-4" /> Ver como o cliente vê
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyLink} className="gap-2">
                    <Copy className="h-4 w-4" /> Copiar link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Edição em breve.')} className="gap-2">
                    <Pencil className="h-4 w-4" /> Editar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={generating}
                className="h-10 gap-1.5"
                title="Descarregar PDF"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                PDF
              </Button>

              <Button
                variant="outline"
                onClick={() => setSendOpen(true)}
                className="h-10 gap-1.5"
                title="Enviar por email"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>

              <Button
                onClick={handleSendByWhatsApp}
                disabled={!hasPhone}
                className="h-10 gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground"
                title={hasPhone ? 'Enviar por WhatsApp' : 'Cliente sem telefone preenchido'}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
