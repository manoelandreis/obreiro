import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Mail, Loader2, Printer, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  buildQuoteHtml,
  loadBrand,
  openPrintWindow,
  type QuoteRenderData,
} from '@/lib/quotePdf';

export default function AppQuotePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppAuth();
  const { isPro, limits } = useSubscription();

  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Pré-visualização');
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!id || !user) return;
      setLoading(true);
      const { data: q } = await supabase
        .from('app_quotes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!q) {
        setLoading(false);
        toast.error('Orçamento não encontrado.');
        return;
      }
      setTitle(q.title);

      const brand = await loadBrand(user.id, isPro);
      const cs = (q.company_snapshot as any) || {};
      const cl = (q.client_snapshot as any) || {};

      // Fallback to user's default payment terms when quote has none
      const { data: settings } = await supabase
        .from('app_user_settings')
        .select('default_payment_terms' as any)
        .eq('user_id', user.id)
        .maybeSingle();
      const defaultTerms = (settings as any)?.default_payment_terms ?? null;

      let attachmentUrls: { url: string; caption: string | null }[] = [];
      if (limits.attachments) {
        const { data: atts } = await supabase
          .from('quote_attachments')
          .select('storage_path, caption')
          .eq('quote_id', q.id)
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
        title: q.title,
        company: {
          name: cs.name ?? cs.company_name,
          nif: cs.nif ?? cs.company_nif,
          email: cs.email ?? cs.company_email,
          phone: cs.phone ?? cs.company_phone,
          address: cs.address ?? cs.company_address,
        },
        client: { name: cl.name, email: cl.email, phone: cl.phone, address: cl.address },
        services: (q.services as any) || [],
        notes: q.notes,
        subtotal: Number(q.subtotal),
        iva: Number(q.iva),
        total: Number(q.total),
        createdAt: q.created_at,
        expiresAt: q.expires_at,
        status: q.status,
        paymentTerms: (q as any).payment_terms ?? defaultTerms,
        paymentAnchor: (q as any).responded_at ?? (q as any).sent_at ?? q.created_at,
      };

      const generated = buildQuoteHtml(data, {
        brand,
        withWatermark: !limits.removeWatermark,
        attachmentUrls,
      });
      setHtml(generated);
      setLoading(false);
    })();
  }, [id, user, isPro, limits.attachments, limits.removeWatermark]);

  const handlePrint = () => {
    if (!html) return;
    if (!openPrintWindow(html)) toast.error('Pop-up bloqueado.');
  };

  return (
    <div className="space-y-4 -mx-4 sm:-mx-6 -my-4 sm:-my-6">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/app/quotes/${id}`)}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Pré-visualização
              </div>
              <h1 className="font-heading font-bold truncate">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={!html}
              className="gap-2"
            >
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={handlePrint} disabled={!html} className="gap-2">
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button
              onClick={() => navigate(`/app/quotes/${id}?send=1`)}
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Mail className="h-4 w-4" /> Enviar
            </Button>
          </div>
        </div>
      </div>

      {/* PDF frame — looks like an A4 sheet inside a document viewer */}
      <div
        className="flex justify-center px-4 sm:px-8 py-10 min-h-[calc(100vh-7rem)]"
        style={{ background: '#525659' }}
      >
        {loading ? (
          <div className="flex items-center gap-2 text-white/80 mt-20">
            <Loader2 className="h-4 w-4 animate-spin" /> A gerar pré-visualização...
          </div>
        ) : html ? (
          <div
            className="bg-white overflow-hidden"
            style={{
              width: '210mm',
              maxWidth: '100%',
              minHeight: '297mm',
              boxShadow:
                '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.35)',
            }}
          >
            <iframe
              title="Pré-visualização do orçamento"
              srcDoc={html}
              className="w-full block bg-white"
              style={{ height: '297mm', minHeight: '297mm', border: 'none' }}
            />
          </div>
        ) : (
          <div className="text-white/80 mt-20">
            Não foi possível carregar o orçamento.
          </div>
        )}
      </div>
    </div>
  );
}
