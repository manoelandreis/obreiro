import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const meta: Meta = { title: 'Primitivos/Formulários' };
export default meta;
type Story = StoryObj;

export const Campos: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do cliente</Label>
        <Input id="nome" placeholder="Ex: João Silva" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nif">NIF</Label>
        <Input id="nif" placeholder="123456789" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="erro">Email</Label>
        <Input id="erro" defaultValue="joao@" aria-invalid className="border-destructive" />
        <p className="text-sm text-destructive">Introduza um email válido.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" placeholder="Observações do orçamento" />
      </div>
    </div>
  ),
};

export const Distintivos: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Pro</Badge>
      <Badge variant="secondary">Rascunho</Badge>
      <Badge variant="outline">Enviado</Badge>
      <Badge variant="destructive">Recusado</Badge>
    </div>
  ),
};

export const Cartao: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Dados da empresa</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Nome, NIF, IBAN e MBWAY usados nos orçamentos.
      </CardContent>
    </Card>
  ),
};
