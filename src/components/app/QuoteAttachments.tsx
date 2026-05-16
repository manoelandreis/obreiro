import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

interface Attachment {
  id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  signedUrl?: string;
}

interface Props {
  quoteId: string;
  disabled?: boolean;
}

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ATTACHMENTS = 12;

export function QuoteAttachments({ quoteId, disabled }: Props) {
  const { user } = useAppAuth();
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sign = async (path: string) => {
    const { data } = await supabase.storage
      .from('quote-attachments')
      .createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('quote_attachments')
      .select('id, storage_path, caption, sort_order')
      .eq('quote_id', quoteId)
      .order('sort_order');
    if (data) {
      const withUrls = await Promise.all(
        data.map(async (it) => ({ ...it, signedUrl: await sign(it.storage_path) }))
      );
      setItems(withUrls);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (quoteId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  const onPick = () => fileRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (items.length + files.length > MAX_ATTACHMENTS) {
      return toast.error(`Máximo de ${MAX_ATTACHMENTS} anexos por orçamento.`);
    }
    setUploading(true);
    for (const f of files) {
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} excede 8MB.`);
        continue;
      }
      const ext = f.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/${quoteId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('quote-attachments')
        .upload(path, f, { contentType: f.type });
      if (upErr) {
        toast.error(`Falhou: ${f.name}`);
        continue;
      }
      const isPhoto = f.type.startsWith('image/');
      const { error: dbErr } = await supabase.from('quote_attachments').insert({
        quote_id: quoteId,
        user_id: user.id,
        type: isPhoto ? 'photo' : 'file',
        storage_path: path,
        sort_order: items.length,
      });
      if (dbErr) {
        await supabase.storage.from('quote-attachments').remove([path]);
        toast.error(`Falhou registo: ${f.name}`);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    await load();
  };

  const remove = async (it: Attachment) => {
    await supabase.from('quote_attachments').delete().eq('id', it.id);
    await supabase.storage.from('quote-attachments').remove([it.storage_path]);
    setItems((prev) => prev.filter((x) => x.id !== it.id));
  };

  const updateCaption = async (id: string, caption: string) => {
    await supabase.from('quote_attachments').update({ caption }).eq('id', id);
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, caption } : x)));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar anexos...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Fotos e anexos</div>
          <div className="text-xs text-muted-foreground">
            {items.length}/{MAX_ATTACHMENTS} ficheiros. Aparecem no PDF enviado ao cliente.
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onPick}
          disabled={uploading || disabled || items.length >= MAX_ATTACHMENTS}
          className="gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Adicionar
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          hidden
          onChange={onChange}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
          Sem anexos. Adicione fotos de referência, antes/depois ou documentos.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((it) => (
            <div key={it.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                {it.signedUrl ? (
                  <img src={it.signedUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <input
                placeholder="Legenda (opcional)"
                defaultValue={it.caption ?? ''}
                onBlur={(e) => {
                  if (e.target.value !== (it.caption ?? '')) {
                    void updateCaption(it.id, e.target.value);
                  }
                }}
                className="mt-1 w-full text-xs px-2 py-1 rounded border border-border bg-background"
              />
              <button
                type="button"
                onClick={() => remove(it)}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
