import { useEffect, useRef } from 'react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { CollapsibleSection } from '@/components/app/CollapsibleSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export interface DraftPhoto {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
}

interface Props {
  photos: DraftPhoto[];
  onChange: (photos: DraftPhoto[]) => void;
  expanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function PhotosSection({ photos, onChange, expanded, onToggle, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const previews = useRef(new Set<string>());

  useEffect(() => () => {
    previews.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = [...photos];
    for (const file of Array.from(event.target.files ?? [])) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: selecione uma imagem.`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name} excede 8MB.`);
        continue;
      }
      if (next.length >= 12) {
        toast.error('Máximo de 12 fotos por orçamento.');
        break;
      }
      const previewUrl = URL.createObjectURL(file);
      previews.current.add(previewUrl);
      next.push({ id: crypto.randomUUID(), file, previewUrl, caption: '' });
    }
    onChange(next);
    event.target.value = '';
  };

  const removePhoto = (photo: DraftPhoto) => {
    URL.revokeObjectURL(photo.previewUrl);
    previews.current.delete(photo.previewUrl);
    onChange(photos.filter((item) => item.id !== photo.id));
  };

  return (
    <CollapsibleSection icon={ImageIcon} title="Fotos" summary={photos.length ? `${photos.length}/12 fotos` : 'Opcional'} open={expanded} onToggle={onToggle}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{photos.length}/12 fotos · Máximo de 8MB por foto</span>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()} disabled={disabled || photos.length >= 12}>
            <Upload className="h-4 w-4" /> Adicionar fotos
          </Button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden disabled={disabled} onChange={addPhotos} aria-label="Selecionar fotos do orçamento" />
        </div>
        {photos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            <ImageIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
            Sem fotos
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative min-w-0">
                <div className="aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                  <img src={photo.previewUrl} alt={photo.caption || photo.file.name} className="h-full w-full object-cover" />
                </div>
                <Button type="button" variant="destructive" size="icon" className="absolute right-1.5 top-1.5 h-7 w-7" aria-label={`Remover foto ${photo.file.name}`} title="Remover foto" disabled={disabled} onClick={() => removePhoto(photo)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Input className="mt-1 text-xs" placeholder="Legenda (opcional)" aria-label={`Legenda de ${photo.file.name}`} disabled={disabled} value={photo.caption} onChange={(event) => onChange(photos.map((item) => item.id === photo.id ? { ...item, caption: event.target.value } : item))} />
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}