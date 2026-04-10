import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface ContentItem {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
}

export default function AdminContent() {
  const [sections, setSections] = useState<ContentItem[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('landing_content').select('*').order('sort_order').then(({ data }) => {
      if (data) setSections(data);
    });
  }, []);

  const update = (id: string, field: string, value: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const save = async (section: ContentItem) => {
    setSaving(section.id);
    const { error } = await supabase.from('landing_content').update({
      title: section.title,
      subtitle: section.subtitle,
      body: section.body,
    }).eq('id', section.id);
    setSaving(null);
    if (error) toast.error('Erro ao guardar.');
    else toast.success(`Secção "${section.section_key}" guardada.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Conteúdo da Landing Page</h1>
        <p className="text-muted-foreground">Edite os textos que aparecem na página pública.</p>
      </div>

      {sections.map((s) => (
        <Card key={s.id}>
          <CardHeader>
            <CardTitle className="text-lg capitalize">{s.section_key.replace('_', ' ')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Título</Label><Input value={s.title || ''} onChange={(e) => update(s.id, 'title', e.target.value)} /></div>
            <div><Label>Subtítulo</Label><Input value={s.subtitle || ''} onChange={(e) => update(s.id, 'subtitle', e.target.value)} /></div>
            <div><Label>Corpo</Label><Textarea value={s.body || ''} onChange={(e) => update(s.id, 'body', e.target.value)} rows={3} /></div>
            <Button onClick={() => save(s)} disabled={saving === s.id} className="gap-2">
              <Save className="h-4 w-4" /> {saving === s.id ? 'A guardar...' : 'Guardar'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
