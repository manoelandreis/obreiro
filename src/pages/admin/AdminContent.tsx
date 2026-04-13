import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Save,
  Layout,
  Image,
  Shield,
  Star,
  Smartphone,
  Info,
  MessageSquare,
  Navigation,
  Lock,
} from 'lucide-react';

interface ContentItem {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
}

interface SectionMeta {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  editable: boolean;
  fields?: ('title' | 'subtitle' | 'body')[];
}

const LANDING_SECTIONS: SectionMeta[] = [
  { key: 'navbar', label: 'Navbar', description: 'Logótipo e links de navegação.', icon: Navigation, editable: false },
  { key: 'hero', label: 'Hero', description: 'Secção principal com título grande e botões de ação.', icon: Layout, editable: true, fields: ['title', 'subtitle'] },
  { key: 'product_snapshots', label: 'Product Snapshots', description: 'Dois cards lado a lado com mockups do produto.', icon: Image, editable: false },
  { key: 'privacy_strip', label: 'Faixa de Privacidade', description: 'Três pilares de segurança: nada guardado, 100% privado, sem rastreamento.', icon: Shield, editable: false },
  { key: 'features', label: 'Funcionalidades', description: 'Grelha de 4 features com ícones.', icon: Star, editable: true, fields: ['title', 'subtitle'] },
  { key: 'app_coming_soon', label: 'App Em Breve', description: 'Secção expandível com funcionalidades da app futura.', icon: Smartphone, editable: false },
  { key: 'about', label: 'Sobre', description: 'Texto sobre a HandyFlow.', icon: Info, editable: true, fields: ['title', 'subtitle', 'body'] },
  { key: 'cta', label: 'Waitlist / CTA', description: 'Formulário de lista de espera com título e subtítulo.', icon: MessageSquare, editable: true, fields: ['title', 'subtitle'] },
  { key: 'footer', label: 'Footer', description: 'Rodapé com copyright.', icon: Layout, editable: false },
];

const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  subtitle: 'Subtítulo',
  body: 'Corpo',
};

export default function AdminContent() {
  const [dbSections, setDbSections] = useState<ContentItem[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('landing_content').select('*').order('sort_order').then(({ data }) => {
      if (data) setDbSections(data);
    });
  }, []);

  const getDbItem = (key: string) => dbSections.find((s) => s.section_key === key);

  const update = (id: string, field: string, value: string) => {
    setDbSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const save = async (item: ContentItem) => {
    setSaving(item.id);
    const { error } = await supabase
      .from('landing_content')
      .update({ title: item.title, subtitle: item.subtitle, body: item.body })
      .eq('id', item.id);
    setSaving(null);
    if (error) toast.error('Erro ao guardar.');
    else toast.success(`Secção "${item.section_key}" guardada.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Conteúdo da Landing Page</h1>
        <p className="text-muted-foreground">
          Mapa completo das secções — edite os textos dinâmicos ou veja o que é fixo no código.
        </p>
      </div>

      <div className="space-y-4">
        {LANDING_SECTIONS.map((meta, idx) => {
          const Icon = meta.icon;
          const dbItem = meta.editable ? getDbItem(meta.key) : null;

          return (
            <Card key={meta.key} className={!meta.editable ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-muted-foreground text-xs font-normal">#{idx + 1}</span>
                        {meta.label}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                    </div>
                  </div>
                  {!meta.editable && (
                    <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                      <Lock className="h-3 w-3" /> Fixo no código
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {meta.editable && dbItem && (
                <CardContent className="space-y-3 pt-0">
                  {meta.fields?.map((field) =>
                    field === 'body' ? (
                      <div key={field}>
                        <Label>{FIELD_LABELS[field]}</Label>
                        <Textarea
                          value={(dbItem as any)[field] || ''}
                          onChange={(e) => update(dbItem.id, field, e.target.value)}
                          rows={3}
                        />
                      </div>
                    ) : (
                      <div key={field}>
                        <Label>{FIELD_LABELS[field]}</Label>
                        <Input
                          value={(dbItem as any)[field] || ''}
                          onChange={(e) => update(dbItem.id, field, e.target.value)}
                        />
                      </div>
                    )
                  )}
                  <Button onClick={() => save(dbItem)} disabled={saving === dbItem.id} className="gap-2">
                    <Save className="h-4 w-4" /> {saving === dbItem.id ? 'A guardar...' : 'Guardar'}
                  </Button>
                </CardContent>
              )}

              {meta.editable && !dbItem && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground italic">
                    Secção não encontrada na base de dados. Adicione uma entrada com section_key = "{meta.key}".
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
