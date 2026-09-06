import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { Loader2, Square, RectangleHorizontal, RectangleVertical, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';

export type LogoKind = 'icon' | 'horizontal' | 'vertical';
export type LogoBg = 'transparent' | 'white';

export const LOGO_HEIGHT_PRESETS = [
  { value: 32, label: 'Pequeno' },
  { value: 44, label: 'Médio' },
  { value: 64, label: 'Grande' },
] as const;

const KIND_ASPECT: Record<LogoKind, number> = { icon: 1, horizontal: 3, vertical: 0.5 };
const KIND_LABEL: Record<LogoKind, string> = {
  icon: 'Quadrado (ícone)',
  horizontal: 'Horizontal (com nome)',
  vertical: 'Vertical',
};
const MAX_OUT = 1000;

export interface LogoEditorResult {
  file: File;
  kind: LogoKind;
  bg: LogoBg;
  height: number;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** New file picked by the user, or null when re-editing an existing logo via sourceUrl. */
  file?: File | null;
  /** Signed URL of the existing logo (used for "Recortar novamente"). */
  sourceUrl?: string | null;
  initialKind?: LogoKind;
  initialBg?: LogoBg;
  initialHeight?: number;
  companyName?: string;
  primaryColor?: string;
  onApply: (result: LogoEditorResult) => void;
}

function suggestKind(w: number, h: number): LogoKind {
  const r = w / h;
  if (r >= 1.8) return 'horizontal';
  if (r <= 0.7) return 'vertical';
  return 'icon';
}

export function LogoEditor({
  open, onOpenChange, file, sourceUrl, initialKind, initialBg, initialHeight,
  companyName, primaryColor, onApply,
}: Props) {
  const isMobile = useIsMobile();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [isSvg, setIsSvg] = useState(false);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [kind, setKind] = useState<LogoKind>(initialKind ?? 'icon');
  const [bg, setBg] = useState<LogoBg>(initialBg ?? 'transparent');
  const [height, setHeight] = useState<number>(initialHeight ?? 44);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tooSmall, setTooSmall] = useState(false);
  const [applying, setApplying] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const vpRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const [vpW, setVpW] = useState(320);

  // Load source (file or URL) when opened
  useEffect(() => {
    if (!open) return;
    setKind(initialKind ?? 'icon');
    setBg(initialBg ?? 'transparent');
    setHeight(initialHeight ?? 44);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNat(null);
    setTooSmall(false);

    let revoke: string | null = null;
    if (file) {
      const url = URL.createObjectURL(file);
      revoke = url;
      setImgUrl(url);
      setIsSvg(file.type === 'image/svg+xml');
    } else if (sourceUrl) {
      setImgUrl(sourceUrl);
      setIsSvg(/\.svg(\?|$)/i.test(sourceUrl));
    } else {
      setImgUrl(null);
    }
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file, sourceUrl]);

  // Measure viewport width
  useEffect(() => {
    if (!open) return;
    const el = vpRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setVpW(el.clientWidth || 320));
    ro.observe(el);
    setVpW(el.clientWidth || 320);
    return () => ro.disconnect();
  }, [open, imgUrl]);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth || 0;
    const h = img.naturalHeight || 0;
    if (!w || !h) return;
    setNat({ w, h });
    if (Math.max(w, h) < 200) setTooSmall(true);
    // Suggest kind only for new uploads (keep existing choice when re-editing)
    if (file) setKind(suggestKind(w, h));
  }, [file]);

  const aspect = KIND_ASPECT[kind];
  const vpH = Math.min(280, Math.round(vpW / aspect));

  // Cover scale so the image always fills the crop viewport
  const cover = nat ? Math.max(vpW / nat.w, vpH / nat.h) : 1;
  const scale = cover * zoom;
  const dispW = nat ? nat.w * scale : 0;
  const dispH = nat ? nat.h * scale : 0;

  const clampOffset = useCallback(
    (o: { x: number; y: number }) => ({
      x: Math.min(0, Math.max(vpW - dispW, o.x)),
      y: Math.min(0, Math.max(vpH - dispH, o.y)),
    }),
    [vpW, vpH, dispW, dispH],
  );

  useEffect(() => {
    setOffset((o) => clampOffset(o));
  }, [clampOffset]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset(clampOffset({ x: d.ox + (e.clientX - d.px), y: d.oy + (e.clientY - d.py) }));
  };
  const onPointerUp = () => { dragRef.current = null; };

  const handleApply = async () => {
    if (!file && !sourceUrl) return;
    // SVG: passthrough without cropping
    if (isSvg) {
      if (file) {
        onApply({ file, kind, bg, height });
      } else {
        // Re-editing existing SVG: no new file needed
        onApply({ file: new File([], 'keep.svg', { type: 'image/svg+xml' }), kind, bg, height });
      }
      return;
    }
    if (!nat || !imgRef.current) return;
    setApplying(true);
    try {
      const img = imgRef.current;
      const sx = -offset.x / scale;
      const sy = -offset.y / scale;
      const sw = vpW / scale;
      const sh = vpH / scale;
      // Cap the output so the longest side is at most MAX_OUT px
      // Output must match the actual cropped region aspect (sh/sw), not the
      // nominal KIND_ASPECT — the viewport height cap can distort that.
      let outW = Math.max(1, Math.round(sw));
      let outH = Math.max(1, Math.round(sh));
      const k = Math.min(1, MAX_OUT / Math.max(outW, outH));
      outW = Math.max(1, Math.round(outW * k));
      outH = Math.max(1, Math.round(outH * k));

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no ctx');
      if (bg === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('no blob');
      onApply({
        file: new File([blob], `logo-${Date.now()}.png`, { type: 'image/png' }),
        kind,
        bg,
        height,
      });
    } catch {
      toast.error('Não foi possível processar a imagem.');
    } finally {
      setApplying(false);
    }
  };

  const canCrop = !isSvg && !!nat;
  const bgDisabled = file ? file.type === 'image/jpeg' : false;

  const headerPreview = (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">
        Pré-visualização no orçamento
      </p>
      <div className={`flex gap-3 ${kind === 'vertical' ? 'flex-col items-start' : 'items-center'}`}>
        {imgUrl && (
          <img
            src={imgUrl}
            alt="Pré-visualização do logo"
            style={{ height, maxWidth: kind === 'horizontal' ? 220 : undefined, width: 'auto', objectFit: 'contain' }}
            className={kind === 'icon' ? 'rounded-md' : ''}
            crossOrigin="anonymous"
          />
        )}
        {kind !== 'horizontal' && (
          <span
            className="font-heading font-bold text-lg"
            style={{ color: primaryColor || '#1B3A5C', lineHeight: 1 }}
          >
            {companyName || 'A Sua Empresa'}
          </span>
        )}
      </div>
    </div>
  );

  const body = (
    <div className="space-y-5 px-1">
      {/* Crop viewport */}
      {!isSvg && imgUrl && (
        <div
          ref={vpRef}
          className="relative w-full overflow-hidden rounded-lg border border-border bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] touch-none select-none"
          style={{ height: vpH }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {nat && (
            <img
              ref={imgRef}
              src={imgUrl}
              alt=""
              draggable={false}
              crossOrigin="anonymous"
              className="absolute pointer-events-none max-w-none"
              style={{
                width: dispW,
                height: dispH,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                backgroundColor: bg === 'white' ? '#ffffff' : undefined,
              }}
            />
          )}
          {!nat && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> A carregar imagem...
            </div>
          )}
        </div>
      )}
      {/* Hidden img used to measure natural size */}
      {imgUrl && (
        <img
          src={imgUrl}
          alt=""
          className="hidden"
          onLoad={onImgLoad}
          crossOrigin="anonymous"
        />
      )}
      {isSvg && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 flex items-center justify-center min-h-28">
          {imgUrl && <img src={imgUrl} alt="Logo SVG" className="max-h-24 max-w-full object-contain" />}
        </div>
      )}

      {tooSmall && (
        <p className="text-xs text-amber-600">
          A imagem é pequena (menos de 200px). Pode ficar desfocada no PDF.
        </p>
      )}

      {/* Zoom */}
      {canCrop && (
        <div className="flex items-center gap-3">
          <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={([v]) => setZoom(v)}
            className="flex-1"
          />
        </div>
      )}

      {/* Orientation */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
          Orientação do logo
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {(['icon', 'horizontal', 'vertical'] as LogoKind[]).map((k) => {
            const Icon = k === 'icon' ? Square : k === 'horizontal' ? RectangleHorizontal : RectangleVertical;
            const active = kind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors ${
                  active
                    ? 'border-accent bg-accent/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-accent/50'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-accent' : ''}`} />
                {KIND_LABEL[k]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Background */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
          Fundo
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {(['transparent', 'white'] as LogoBg[]).map((b) => {
            const active = bg === b;
            const disabled = b === 'transparent' && bgDisabled;
            return (
              <button
                key={b}
                type="button"
                disabled={disabled}
                onClick={() => setBg(b)}
                title={disabled ? 'JPG não suporta fundo transparente' : undefined}
                className={`rounded-lg border p-3 text-xs transition-colors ${
                  active
                    ? 'border-accent bg-accent/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-accent/50'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {b === 'transparent' ? 'Transparente' : 'Branco'}
              </button>
            );
          })}
        </div>
        {bgDisabled && (
          <p className="text-xs text-muted-foreground">Ficheiros JPG não suportam fundo transparente.</p>
        )}
      </div>

      {/* Height */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
          Altura máxima no orçamento
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {LOGO_HEIGHT_PRESETS.map((p) => {
            const active = height === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setHeight(p.value)}
                className={`rounded-lg border p-3 text-xs transition-colors ${
                  active
                    ? 'border-accent bg-accent/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-accent/50'
                }`}
              >
                {p.label}
                <span className="block text-[10px] text-muted-foreground">{p.value}px</span>
              </button>
            );
          })}
        </div>
      </div>

      {headerPreview}

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button
          onClick={handleApply}
          disabled={applying || (!isSvg && !nat)}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {applying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Aplicar
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader>
            <DrawerTitle>Ajustar logotipo</DrawerTitle>
            <DrawerDescription>Recorte, orientação e fundo do logo da empresa.</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustar logotipo</DialogTitle>
          <DialogDescription>Recorte, orientação e fundo do logo da empresa.</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
