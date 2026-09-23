import type { Meta, StoryObj } from '@storybook/react';
import { CollapsibleSection } from '@/components/app/CollapsibleSection';
import { Input } from '@/components/ui/input';
import { User, Wrench, CreditCard, FileText } from 'lucide-react';

const meta: Meta<typeof CollapsibleSection> = {
  title: 'Componentes da App/CollapsibleSection',
  component: CollapsibleSection,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CollapsibleSection>;

export const Fechada: Story = {
  args: {
    icon: User,
    title: 'Cliente',
    summary: 'João Silva',
    children: <Input placeholder="Nome do cliente" />,
  },
};

export const Aberta: Story = {
  args: { ...Fechada.args, defaultOpen: true },
};

export const SecoesDoOrcamento: Story = {
  render: () => (
    <div className="max-w-2xl space-y-4">
      <CollapsibleSection icon={User} title="Cliente" summary="João Silva">
        <Input placeholder="Nome" />
      </CollapsibleSection>
      <CollapsibleSection icon={Wrench} title="Serviços" summary="2 serviços · 150,00 €">
        <p className="text-sm text-muted-foreground">Lista de materiais e mão de obra.</p>
      </CollapsibleSection>
      <CollapsibleSection icon={CreditCard} title="Pagamento" summary="50% adiantamento">
        <p className="text-sm text-muted-foreground">Condições e parcelas.</p>
      </CollapsibleSection>
      <CollapsibleSection icon={FileText} title="Notas e condições">
        <p className="text-sm text-muted-foreground">Texto livre.</p>
      </CollapsibleSection>
    </div>
  ),
};

export const Telemovel: Story = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: SecoesDoOrcamento.render,
};
