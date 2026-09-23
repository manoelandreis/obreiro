import type { Meta, StoryObj } from '@storybook/react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

const meta: Meta = { title: 'Componentes da app/Modais' };
export default meta;
type Story = StoryObj;

function ClientFormFields({ withError = false }: { withError?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="c-nome">Nome *</Label>
        <Input id="c-nome" placeholder="Ex: João Silva" defaultValue={withError ? '' : 'João Silva'} />
        {withError && <p className="text-sm text-destructive">Indique o nome do cliente.</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="c-nif">NIF</Label>
          <Input id="c-nif" placeholder="123456789" defaultValue={withError ? '12' : '234567890'} />
          {withError && <p className="text-sm text-destructive">NIF inválido.</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-tel">Telefone</Label>
          <Input id="c-tel" placeholder="912 345 678" defaultValue={withError ? '' : '912 345 678'} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-email">Email</Label>
        <Input id="c-email" placeholder="cliente@email.pt" defaultValue={withError ? 'joao@' : 'joao@email.pt'} />
        {withError && <p className="text-sm text-destructive">Introduza um email válido.</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-morada">Morada</Label>
        <Input id="c-morada" placeholder="Rua, n.º, código postal" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-notas">Notas</Label>
        <Textarea id="c-notas" placeholder="Observações internas" />
      </div>
    </div>
  );
}

export const ClienteComputador: Story = {
  name: 'Novo cliente (computador)',
  render: () => (
    <div className="bg-muted/50 p-10 flex justify-center">
      <Card className="w-[520px] shadow-lg">
        <CardContent className="p-6 space-y-5">
          <h2 className="font-heading text-lg font-bold">Novo cliente</h2>
          <ClientFormFields />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost">Cancelar</Button>
            <Button>Guardar cliente</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const ClienteComErros: Story = {
  name: 'Novo cliente (com erros)',
  render: () => (
    <div className="bg-muted/50 p-10 flex justify-center">
      <Card className="w-[520px] shadow-lg">
        <CardContent className="p-6 space-y-5">
          <h2 className="font-heading text-lg font-bold">Novo cliente</h2>
          <ClientFormFields withError />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost">Cancelar</Button>
            <Button>Guardar cliente</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const ClienteTelemovel: Story = {
  name: 'Novo cliente (telemóvel)',
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <div className="w-[390px] h-[680px] bg-black/40 flex items-end rounded-xl overflow-hidden">
      <div className="w-full bg-card rounded-t-2xl p-5 space-y-5 max-h-[85%] overflow-y-auto">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-muted" />
        <h2 className="font-heading text-lg font-bold">Novo cliente</h2>
        <ClientFormFields />
        <Button className="w-full">Guardar cliente</Button>
      </div>
    </div>
  ),
};

export const EditorDeLogotipo: Story = {
  name: 'Editor de logótipo',
  render: () => (
    <div className="bg-muted/50 p-10 flex justify-center">
      <Card className="w-[520px] shadow-lg">
        <CardContent className="p-6 space-y-5">
          <h2 className="font-heading text-lg font-bold">Logótipo da empresa</h2>
          <div className="aspect-[3/1] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
            <p className="text-sm">Pré-visualização do recorte</p>
          </div>
          <div className="flex gap-2">
            {['Quadrado 1:1', 'Horizontal 3:1', 'Vertical 1:2'].map((o, i) => (
              <button
                key={o}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  i === 1 ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-full text-xs font-medium border border-primary text-primary">Fundo transparente</button>
            <button className="px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground">Fundo branco</button>
          </div>
          <div className="space-y-2">
            <Label>Altura no orçamento</Label>
            <Slider defaultValue={[48]} min={24} max={96} step={4} />
          </div>
          <div className="flex justify-between">
            <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Substituir ficheiro</Button>
            <Button>Guardar logótipo</Button>
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP ou SVG até 5 MB.</p>
        </CardContent>
      </Card>
    </div>
  ),
};
