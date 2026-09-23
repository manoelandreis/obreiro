import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { Download, Send } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Primitivos/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Guardar Orçamento' },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primario: Story = {};

export const Variantes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button>Primário</Button>
      <Button variant="secondary">Secundário</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Eliminar</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Tamanhos: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Pequeno</Button>
      <Button size="default">Normal</Button>
      <Button size="lg">Grande</Button>
      <Button size="icon"><Download className="h-4 w-4" /></Button>
    </div>
  ),
};

export const ComIcone: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button><Download className="h-4 w-4 mr-2" />Descarregar PDF</Button>
      <Button variant="outline"><Send className="h-4 w-4 mr-2" />Enviar por email</Button>
    </div>
  ),
};

export const LarguraTotalMobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => <Button className="w-full">Descarregar PDF</Button>,
};
