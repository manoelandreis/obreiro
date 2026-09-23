import type { Meta, StoryObj } from '@storybook/react';
import { Building2, FileText, Wallet } from 'lucide-react';
import { StatusBadge } from '@/components/app/QuoteStatusBadge';
import { PaymentTermsCard } from '@/components/app/PaymentTermsCard';
import { PasswordStrengthMeter } from '@/components/app/PasswordStrengthMeter';
import { SectionHeader } from '@/components/app/SectionHeader';
import { evaluatePassword } from '@/lib/passwordPolicy';
import { PAYMENT_PRESETS } from '@/lib/paymentTerms';
import { Card, CardContent } from '@/components/ui/card';

const meta: Meta = { title: 'Componentes da app/Domínio' };
export default meta;
type Story = StoryObj;

const statuses = ['rascunho', 'enviado', 'visto', 'aceite', 'rejeitado', 'expirado'] as const;

export const EstadosDoOrcamento: Story = {
  name: 'Estados do orçamento',
  render: () => (
    <div className="flex flex-wrap gap-3">
      {statuses.map((s) => <StatusBadge key={s} status={s} />)}
    </div>
  ),
};

export const CondicoesDePagamento: Story = {
  name: 'Condições de pagamento',
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 max-w-3xl">
      {PAYMENT_PRESETS.map((p) => (
        <PaymentTermsCard
          key={p.id}
          paymentTerms={{ preset: p.id, installments: p.installments }}
          total={1845}
          anchor={new Date('2026-09-21')}
        />
      ))}
    </div>
  ),
};

export const DadosDePagamento: Story = {
  name: 'IBAN e MBWAY',
  render: () => (
    <Card className="max-w-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide font-bold text-primary">
          <Wallet className="h-4 w-4 text-accent" /> Dados de pagamento
        </div>
        <div>
          <p className="text-xs text-muted-foreground">IBAN</p>
          <p className="text-sm font-medium">PT50 0002 0123 1234 5678 9015 4</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">MBWAY</p>
          <p className="text-sm font-medium">912 345 678</p>
        </div>
      </CardContent>
    </Card>
  ),
};

export const ForcaDaPalavraPasse: Story = {
  name: 'Força da palavra-passe',
  render: () => (
    <div className="max-w-sm space-y-8">
      {['123456', 'obreiro12', 'Obreiro!2026pt'].map((pw) => (
        <div key={pw}>
          <p className="text-sm mb-1 text-muted-foreground">Exemplo: {pw}</p>
          <PasswordStrengthMeter evaluation={evaluatePassword(pw, { email: 'joao@email.pt' })} show />
        </div>
      ))}
    </div>
  ),
};

export const CabecalhoDeSeccao: Story = {
  name: 'Cabeçalho de secção',
  render: () => (
    <div className="space-y-8 max-w-xl">
      <SectionHeader icon={FileText} title="Novo orçamento" description="Preencha os dados e partilhe com o cliente." />
      <SectionHeader icon={Building2} title="Identidade da empresa" description="Logótipo, NIF e dados de pagamento." />
    </div>
  ),
};
