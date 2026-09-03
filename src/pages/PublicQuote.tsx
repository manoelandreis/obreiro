import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, FileText, Loader2, ShieldCheck, Download } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentTermsCard } from '@/components/app/PaymentTermsCard';
import { DEFAULT_PAYMENT_TERMS, type PaymentTerms } from '@/lib/paymentTerms';
import { buildQuoteHtml, openPrintWindow, type QuoteRenderData } from '@/lib/quotePdf';


interface PublicQuote {
  id: string;
  title: string;
  status: 'rascunho' | 'enviado' | 'visto' | 'aceite' | 'rejeitado' | 'expirado';
  company_snapshot: any;
  client_snapshot: any;
  services: any[];
  subtotal: number;
  iva: number;
  total: number;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
  sent_at: string | null;
  responded_at: string | null;
  payment_terms: PaymentTerms | null;
}

const fmt = (v: number) => Number(v).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export default function PublicQuote() {
  const { token } = useParams();
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<'accept' | 'reject' | null>(null);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState<'aceite' | 'rejeitado' | null>(null);
  const downloadBtnRef = useRef<HTMLButtonElement | null>(null);
  const [showFloatingDownload, setShowFloatingDownload] = useState(false);

  useEffect(() => {
    const el = downloadBtnRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFloatingDownload(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -20px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [quote]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_public_quote', { _token: token });
      if (error || !data) {
        setLoading(false);
        return;
      }
      setQuote(data as any);
      // Fire-and-forget mark-as-viewed
      void supabase.rpc('mark_quote_viewed', { _token: token });
      setLoading(false);
    })();
  }, [token]);

  const respond = async (action: 'accept' | 'reject') => {
    if (!token) return;
    setResponding(action);
    const { data, error } = await supabase.rpc('respond_to_quote', {
      _token: token,
      _action: action,
      _message: message || null,
    });
    setResponding(null);
    if (error) return toast.error('Erro ao registar resposta.');
    const result = data as any;
    if (!result?.ok) {
      return toast.error(
        result?.error === 'already_responded' ? 'Já respondeu a este orçamento.' : 'Erro.'
      );
    }
    setDone(result.status);
    toast.success(action === 'accept' ? 'Orçamento aceite!' : 'Resposta registada.');
  };

  const handleDownloadPdf = () => {
    if (!quote) return;
    const cs = quote.company_snapshot || {};
    const cl = quote.client_snapshot || {};
    const logoUrl = cs.logo_path && token
      ? `https://cprysybqjtsynxofljxc.supabase.co/functions/v1/get-quote-logo?token=${token}`
      : null;
    const data: QuoteRenderData = {
      title: quote.title,
      company: {
        name: cs.name ?? cs.company_name,
        nif: cs.nif ?? cs.company_nif,
        email: cs.email ?? cs.company_email,
        phone: cs.phone ?? cs.company_phone,
        address: cs.address ?? cs.company_address,
        iban: cs.iban ?? cs.payment_iban,
        mbway: cs.mbway ?? cs.payment_mbway,
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
      paymentTerms: quote.payment_terms ?? DEFAULT_PAYMENT_TERMS,
      paymentAnchor: quote.responded_at ?? quote.sent_at ?? quote.created_at,
    };
    const html = buildQuoteHtml(data, {
      brand: {
        logoUrl,
        logoKind: (cs.logo_kind as 'icon' | 'horizontal' | 'vertical') ?? 'icon',
        logoHeight: Number(cs.logo_height) || 44,
        primary: cs.brand_primary || '#1B3A5C',
        accent: cs.brand_accent || '#E8730A',
        description: null,
        terms: cs.terms || null,
        paymentConditions: null,
        validityDays: 30,
      },
      withWatermark: false,
    });
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error('Pop-up bloqueado.');
    openPrintWindow(html, printWindow);
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar...
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardContent className="pt-8 text-center space-y-3">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="font-heading text-xl font-bold">Orçamento não encontrado</h1>
            <p className="text-sm text-muted-foreground">
              O link pode estar incorreto ou o orçamento foi removido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cs = quote.company_snapshot || {};
  const cl = quote.client_snapshot || {};
  const responded = ['aceite', 'rejeitado'].includes(quote.status) || done;
  const finalStatus = done ?? quote.status;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-2">
          <ShieldCheck className="h-4 w-4" />
          Orçamento partilhado por {cs.name || cs.company_name || 'a sua empresa'}
        </div>

        {/* Quote summary card */}
        <Card>
          <CardContent className="pt-8 space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className={`flex gap-3 ${cs.logo_kind === 'vertical' ? 'flex-col items-start' : 'items-center'}`}>
                  {cs.logo_path && (
                    <img
                      src={`https://cprysybqjtsynxofljxc.supabase.co/functions/v1/get-quote-logo?token=${token}`}
                      alt="Logo"
                      className={`object-contain shrink-0 ${cs.logo_kind === 'icon' || !cs.logo_kind ? 'rounded-md' : ''}`}
                      style={{
                        height: Math.min(96, Math.max(24, Number(cs.logo_height) || 44)),
                        width: 'auto',
                        maxWidth: cs.logo_kind === 'horizontal' ? 220 : undefined,
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  {cs.logo_kind !== 'horizontal' && (
                    <div
                      className="text-xl font-heading font-bold text-primary"
                      style={{
                        lineHeight: 1,
                        textBoxTrim: 'trim-both',
                        textBoxEdge: 'cap alphabetic',
                      } as React.CSSProperties}
                    >
                      {cs.name || cs.company_name || 'A Sua Empresa'}
                    </div>
                  )}
                </div>
                {cs.nif && <div className="text-xs text-muted-foreground mt-2">NIF: {cs.nif}</div>}
                {cs.email && <div className="text-xs text-muted-foreground">{cs.email}</div>}
                {cs.phone && <div className="text-xs text-muted-foreground">{cs.phone}</div>}
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                  Orçamento
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(quote.created_at).toLocaleDateString('pt-PT')}
                </div>
                {quote.expires_at && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Válido até {new Date(quote.expires_at).toLocaleDateString('pt-PT')}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h1 className="font-heading text-2xl font-bold">{quote.title}</h1>
              {cl.name && (
                <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>{cl.name}</span>
                  {cl.email && <span>· {cl.email}</span>}
                  {cl.phone && <span>· {cl.phone}</span>}
                  {cl.address && <span>· {cl.address}</span>}
                </div>
              )}
            </div>

            {/* Services */}
            <div className="space-y-4">
              {quote.services?.map((s: any, idx: number) => {
                const labor = (s.pricePerHour || 0) * (s.hours || 0);
                const matsTotal = (s.materials || []).reduce(
                  (a: number, m: any) => a + (m.quantity || 0) * (m.unitPrice || 0),
                  0
                );
                const total = labor + matsTotal;
                return (
                  <div key={idx} className="border rounded-lg p-4 bg-muted/20">
                    <div className="font-semibold">
                      {idx + 1}. {s.name || `Serviço ${idx + 1}`}
                    </div>
                    {s.description && (
                      <div className="text-sm text-muted-foreground mt-1">{s.description}</div>
                    )}
                    <div className="mt-3 divide-y">
                      {s.hours > 0 && (
                        <div className="flex items-center justify-between gap-3 py-2 text-sm">
                          <div className="min-w-0">
                            <span className="font-semibold">Mão de obra</span>
                            <span className="text-muted-foreground"> · {s.hours}h × {fmt(s.pricePerHour)}/h</span>
                          </div>
                          <span className="font-semibold whitespace-nowrap">{fmt(labor)}</span>
                        </div>
                      )}
                      {s.materials?.map((m: any, mi: number) => (
                        <div key={mi} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <div className="min-w-0">
                            <span className="font-semibold">{m.name}</span>
                            <span className="text-muted-foreground"> · {m.quantity} {m.unit} × {fmt(m.unitPrice)}</span>
                          </div>
                          <span className="font-semibold whitespace-nowrap">{fmt(m.quantity * m.unitPrice)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-right text-sm font-semibold text-primary mt-2 border-t pt-2">
                      Total: {fmt(total)}
                    </div>
                  </div>
                );
              })}
            </div>


            {/* Totals */}
            <div className="border-t pt-4 flex justify-between items-end gap-4 flex-wrap">
              <div className="text-sm text-muted-foreground space-y-1">
                {cs.mbway && <div><span className="font-semibold">MBWAY:</span> {cs.mbway}</div>}
                {cs.iban && <div><span className="font-semibold">IBAN:</span> {cs.iban}</div>}
              </div>
              <div className="text-right space-y-1 ml-auto">
                <div className="text-sm text-muted-foreground">Subtotal: {fmt(quote.subtotal)}</div>
                <div className="text-sm text-muted-foreground">IVA (23%): {fmt(quote.iva)}</div>
                <div className="text-2xl font-bold text-primary">Total: {fmt(quote.total)}</div>
              </div>
            </div>

            <PaymentTermsCard
              paymentTerms={quote.payment_terms ?? DEFAULT_PAYMENT_TERMS}
              total={Number(quote.total)}
              anchor={quote.responded_at ?? quote.sent_at ?? quote.created_at}
            />

            {quote.notes && (
              <div className="border-t pt-4">
                <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1">
                  Notas
                </div>
                <div className="text-sm whitespace-pre-wrap">{quote.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          ref={downloadBtnRef}
          onClick={handleDownloadPdf}
          className="w-full h-12 gap-2 bg-accent hover:bg-accent/90 text-white shadow-sm"
        >
          <Download className="h-4 w-4" />
          Descarregar PDF
        </Button>

        {/* Action card */}

        {responded ? (
          <Card className={finalStatus === 'aceite' ? 'border-emerald-300 bg-emerald-50' : 'border-red-200 bg-red-50'}>
            <CardContent className="pt-6 text-center">
              {finalStatus === 'aceite' ? (
                <>
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                  <div className="font-semibold text-emerald-900">Orçamento aceite</div>
                  <p className="text-sm text-emerald-800 mt-1">
                    {cs.name || 'A empresa'} foi notificado e entrará em contacto.
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="h-10 w-10 text-red-600 mx-auto mb-2" />
                  <div className="font-semibold text-red-900">Resposta registada</div>
                  <p className="text-sm text-red-800 mt-1">
                    Obrigado pela sua resposta.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> O que decide?
              </div>
              <Textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mensagem (opcional) para a empresa..."
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => respond('accept')}
                  disabled={!!responding}
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {responding === 'accept' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Aceitar orçamento
                </Button>
                <Button
                  variant="outline"
                  onClick={() => respond('reject')}
                  disabled={!!responding}
                  className="flex-1 gap-2"
                >
                  {responding === 'reject' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Rejeitar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground">
          Powered by <a href="/" className="text-primary hover:underline">Obreiro</a>
        </div>
      </div>

      <div
        className={`fixed bottom-4 inset-x-0 px-4 z-40 md:hidden pointer-events-none transition-all duration-200 ${
          showFloatingDownload ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        aria-hidden={!showFloatingDownload}
      >
        <div className="max-w-3xl mx-auto">
          <Button
            onClick={handleDownloadPdf}
            className="pointer-events-auto w-full h-12 gap-2 bg-accent hover:bg-accent/90 text-white shadow-lg"
          >
            <Download className="h-4 w-4" />
            Descarregar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
