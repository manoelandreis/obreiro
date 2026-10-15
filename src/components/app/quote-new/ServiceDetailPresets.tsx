import { useEffect, useState } from 'react';
import { BookmarkPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hasDetails, type ServiceDetails } from '@/lib/quoteLayout';

export interface DetailPreset { id: string; name: string; details: ServiceDetails; }

/** Loads the signed-in user's saved technical details (shared by all service cards). */
export function useDetailPresets(userId?: string) {
  const [presets, setPresets] = useState<DetailPreset[]>([]);
  useEffect(() => {
    if (!userId) return;
    void supabase.from('service_detail_presets').select('id, name, details').order('name').then(({ data }) => {
      setPresets((data || []) as unknown as DetailPreset[]);
    });
  }, [userId]);

  const save = async (name: string, details: ServiceDetails) => {
    if (!userId) return toast.error('Crie conta para guardar detalhes técnicos.');
    const { data, error } = await supabase.from('service_detail_presets')
      .insert({ user_id: userId, name, details: details as never }).select('id, name, details').single();
    if (error || !data) return toast.error('Não foi possível guardar.');
    setPresets((p) => [...p, data as unknown as DetailPreset].sort((a, b) => a.name.localeCompare(b.name)));
    toast.success(`Detalhe «${name}» guardado para próximos orçamentos.`);
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from('service_detail_presets').delete().eq('id', id);
    if (error) return toast.error('Não foi possível apagar.');
    setPresets((p) => p.filter((x) => x.id !== id));
  };
  return { presets, save, remove };
}

interface Props {
  serviceName: string;
  details?: ServiceDetails;
  presets: DetailPreset[];
  onApply: (d: ServiceDetails) => void;
  onSave: (name: string, d: ServiceDetails) => void;
  onRemove: (id: string) => void;
}

export function ServiceDetailPresetBar({ serviceName, details, presets, onApply, onSave, onRemove }: Props) {
  const [selected, setSelected] = useState('');
  const handleSave = () => {
    if (!hasDetails(details)) return toast.error('Preencha o detalhe técnico antes de guardar.');
    const name = window.prompt('Nome para este detalhe técnico:', serviceName || '')?.trim();
    if (name) onSave(name, details!);
  };
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {presets.length > 0 && (
        <div className="flex gap-2 flex-1 min-w-0">
          <Select value={selected} onValueChange={(v) => {
            setSelected(v);
            const p = presets.find((x) => x.id === v);
            if (p) { onApply({ ...p.details }); toast.success(`Detalhe «${p.name}» aplicado.`); }
          }}>
            <SelectTrigger className="flex-1 min-w-0"><SelectValue placeholder="Usar detalhe guardado..." /></SelectTrigger>
            <SelectContent>
              {presets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {selected && (
            <Button type="button" variant="ghost" size="icon" aria-label="Apagar detalhe guardado"
              onClick={() => { if (window.confirm('Apagar este detalhe guardado?')) { onRemove(selected); setSelected(''); } }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" className="gap-2 sm:ml-auto" onClick={handleSave}>
        <BookmarkPlus className="h-4 w-4" /> Guardar para reutilizar
      </Button>
    </div>
  );
}
