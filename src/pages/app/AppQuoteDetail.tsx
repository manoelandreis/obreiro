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
import { StatusBadge } from '@/components/app/QuoteStatusBadge';
import { QuoteAttachments } from '@/components/app/QuoteAttachments';
import { FeatureGate } from '@/components/app/FeatureGate';
import {
  ArrowLeft, Download, Mail, Link as LinkIcon, Copy, History, Sparkles, Loader2, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { buildQuoteHtml, loadBrand, openPrintWindow, type QuoteRenderData } from '@/lib/quotePdf';

interface QuoteRow {
  id: string;
  title: string;
  status: 'rascunho' | 'enviado' | 'visto' | 'aceite' | 'rejeitado' | 'expirado';
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
}

interface HistoryRow { id: string; status: string; source: string; note: string | null; created_at: string }

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

  const publicUrl = useMemo(
    () => (quote ? `${window.location.origin}/q/${quote.public_token}` : ''),
    [quote]
  );

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

  const setExpiry = async () => {
    if (!quote) return;
    if (quote.expires_at) return;
    // First time -> compute from user's validity setting
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

  const buildHtml = async (): Promise<string | null> => {
    if (!quote || !user) return null;
    const brand = await loadBrand(user.id, isPro);
    const cs = quote.company_snapshot || {};
    const cl = quote.client_snapshot || {};

    // Load attachments for Pro users
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
    };
    return buildQuoteHtml(data, {
      brand,
      withWatermark: !limits.removeWatermark,
      attachmentUrls,
    });
  };

  const handleDownload = async () => {
    setGenerating(true);
    const html = await buildHtml();
    setGenerating(false);
    if (!html) return toast.error('Não foi possível gerar o PDF.');
    if (!openPrintWindow(html)) toast.error('Pop-up bloqueado.');
  };

  const handlePreview = async () => {
    setGenerating(true);
    const html = await buildHtml();
    setGenerating(false);
    if (!html) return;
    const w = window.open('', '_blank');
    if (!w) return toast.error('Pop-up bloqueado.');
    w.document.write(html);
    w.document.close();
  };

  const recordSent = async () => {
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
      });
    }
    await load();
  };

  const handleSendByEmail = async () => {
    if (!recipient) return toast.error('Insira um email.');
    if (!quote) return;
    await recordSent();
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

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    toast.success('Link copiado.');
  };

  const updateStatus = async (status: QuoteRow['status']) => {
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

  const cs = quote.company_snapshot || {};
  const cl = quote.client_snapshot || {};

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/quotes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-2xl font-bold">{quote.title}</h1>
              <StatusBadge status={quote.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Criado em {new Date(quote.created_at).toLocaleDateString('pt-PT')}
              {cl.name ? ` • ${cl.name}` : ''}
              {quote.expires_at
                ? ` • Válido até ${new Date(quote.expires_at).toLocaleDateString('pt-PT')}`
                : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handlePreview} disabled={generating} className="gap-2">
            <FileText className="h-4 w-4" /> Pré-visualizar
          </Button>
          <Button onClick={handleDownload} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </Button>
          <Button onClick={() => setSendOpen(true)} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
            <Mail className="h-4 w-4" /> Enviar
          </Button>
        </div>
      </div>

      {/* Public link */}
      <Card>
        <CardContent className="pt-5 flex items-center gap-3 flex-wrap">
          <LinkIcon className="h-4 w-4 text-primary" />
          <div className="flex-1 min-w-[220px]">
            <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
              Link público para o cliente
            </div>
            <code className="text-xs break-all">{publicUrl}</code>
          </div>
          <Button variant="outline" size="sm" onClick={copyLink} className="gap-2">
            <Copy className="h-3.5 w-3.5" /> Copiar
          </Button>
          {limits.tracking && (
            <div className="text-xs text-muted-foreground">
              {quote.viewed_at
                ? `👁 Visto em ${new Date(quote.viewed_at).toLocaleDateString('pt-PT')}`
                : '⏳ Ainda não visualizado'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status controls */}
      <Card>
        <CardContent className="pt-5">
          <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-3">
            Atualizar estado
          </div>
          <div className="flex flex-wrap gap-2">
            {(['enviado', 'aceite', 'rejeitado', 'expirado'] as const).map((s) => (
              <Button
                key={s}
                variant={quote.status === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateStatus(s)}
              >
                Marcar como {s}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
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

      {/* Totals snapshot */}
      <Card>
        <CardContent className="pt-6 space-y-1 text-right">
          <div className="text-sm text-muted-foreground">
            Subtotal: {Number(quote.subtotal).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </div>
          <div className="text-sm text-muted-foreground">
            IVA: {Number(quote.iva).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </div>
          <div className="text-2xl font-bold text-primary border-t pt-2">
            Total: {Number(quote.total).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </div>
        </CardContent>
      </Card>

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
            <DialogTitle>Enviar orçamento</DialogTitle>
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
    </div>
  );
}
