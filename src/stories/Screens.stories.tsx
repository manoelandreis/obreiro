import type { Meta, StoryObj } from '@storybook/react';
import { Download, FileText, Package, Plus, StickyNote, User, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CollapsibleSection } from '@/components/app/CollapsibleSection';
import { PaymentTermsCard } from '@/components/app/PaymentTermsCard';
import { StatusBadge } from '@/components/app/QuoteStatusBadge';
import { SidebarDesktop, MobileTopBar, MobileBottomNav, LandingNavbar } from './Navigation.stories';
import { QuotesToolbar, QuotesTable, ClientsTable, MaterialsTable, EmptyState } from './Tables.stories';

const meta: Meta = { title: 'Ecrãs/Aplicação' };
export default meta;
type Story = StoryObj;

function DesktopShell({ title, active, children }: { title: string; active: string; children: React.ReactNode }) {
  return (
    <div className="flex w-[1280px] bg-background">
      <SidebarDesktop active={active} />
      <main className="flex-1 p-8 space-y-6 overflow-y-auto h-[640px]">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">{title}</h1>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Novo</Button>
        </div>
        {children}
      </main>
    </div>
  );
}

function MobileShell({ title, active, children }: { title: string; active: string; children: React.ReactNode }) {
  return (
    <div className="w-[390px] h-[720px] flex flex-col border border-border rounded-xl overflow-hidden bg-background">
      <MobileTopBar title={title} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
      <MobileBottomNav active={active} />
    </div>
  );
}

export const OrcamentosComputador: Story = {
  name: 'Orçamentos — computador (com dados)',
  render: () => (
    <DesktopShell title="Orçamentos" active="Orçamentos">
      <QuotesToolbar />
      <QuotesTable />
    </DesktopShell>
  ),
};

export const OrcamentosComputadorVazio: Story = {
  name: 'Orçamentos — computador (vazio)',
  render: () => (
    <DesktopShell title="Orçamentos" active="Orçamentos">
      <QuotesToolbar />
      <EmptyState
        title="Ainda não tem orçamentos"
        description="Crie o primeiro orçamento e partilhe por WhatsApp, email ou link."
        action="Criar orçamento"
      />
    </DesktopShell>
  ),
};

export const OrcamentosTelemovel: Story = {
  name: 'Orçamentos — telemóvel (com dados)',
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <MobileShell title="Orçamentos" active="Orçamentos">
      {[
        { n: 'ORC-2026-014', c: 'João Silva', t: '1 845,00 €', s: 'enviado' as const },
        { n: 'ORC-2026-013', c: 'Maria Costa', t: '620,50 €', s: 'aceite' as const },
        { n: 'ORC-2026-012', c: 'Café Central, Lda.', t: '3 210,00 €', s: 'visto' as const },
      ].map((q) => (
        <Card key={q.n}>
          <CardContent className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{q.c}</p>
              <p className="text-xs text-muted-foreground">{q.n}</p>
              <div className="mt-2"><StatusBadge status={q.s} /></div>
            </div>
            <span className="font-semibold text-accent whitespace-nowrap">{q.t}</span>
          </CardContent>
        </Card>
      ))}
      <Button className="w-full gap-2"><Plus className="h-4 w-4" /> Novo orçamento</Button>
    </MobileShell>
  ),
};

export const OrcamentosTelemovelVazio: Story = {
  name: 'Orçamentos — telemóvel (vazio)',
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <MobileShell title="Orçamentos" active="Orçamentos">
      <EmptyState
        title="Ainda não tem orçamentos"
        description="Crie o primeiro e partilhe por WhatsApp, email ou link."
        action="Criar orçamento"
      />
    </MobileShell>
  ),
};

export const ClientesComputador: Story = {
  name: 'Clientes — computador',
  render: () => (
    <DesktopShell title="Clientes" active="Clientes">
      <ClientsTable />
    </DesktopShell>
  ),
};

function QuoteForm({ open }: { open: boolean }) {
  return (
    <div className="space-y-4">
      <CollapsibleSection icon={User} title="Cliente" summary={open ? 'João Silva · 912 345 678' : 'Escolha ou crie um cliente'} defaultOpen={open}>
        <div className="space-y-3">
          <div className="space-y-2"><Label>Cliente</Label><Input defaultValue="João Silva" /></div>
          <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Novo cliente</Button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={Package} title="Serviços e materiais" summary={open ? '4 itens · 2 270,16 €' : 'Sem itens'} defaultOpen={open}>
        <MaterialsTable />
      </CollapsibleSection>

      <CollapsibleSection icon={Wallet} title="Pagamento" summary={open ? '50% sinal + 50% conclusão' : 'Por definir'} defaultOpen={open}>
        <PaymentTermsCard
          paymentTerms={{ preset: '50_50', installments: [
            { label: 'Sinal', percent: 50, due_offset_days: 0 },
            { label: 'Conclusão', percent: 50, due_offset_days: 30 },
          ] }}
          total={2270.16}
          anchor={new Date('2026-09-21')}
        />
      </CollapsibleSection>

      <CollapsibleSection icon={StickyNote} title="Notas e condições" summary={open ? 'Garantia de 2 anos' : 'Sem notas'} defaultOpen={open}>
        <Textarea defaultValue={open ? 'Garantia de 2 anos sobre a mão de obra.' : ''} />
      </CollapsibleSection>
    </div>
  );
}

export const NovoOrcamentoVazio: Story = {
  name: 'Novo orçamento — computador (vazio)',
  render: () => (
    <DesktopShell title="Novo orçamento" active="Orçamentos">
      <QuoteForm open={false} />
    </DesktopShell>
  ),
};

export const NovoOrcamentoPreenchido: Story = {
  name: 'Novo orçamento — computador (preenchido)',
  render: () => (
    <DesktopShell title="Novo orçamento" active="Orçamentos">
      <QuoteForm open />
      <Button className="w-full md:w-auto">Guardar orçamento</Button>
    </DesktopShell>
  ),
};

export const NovoOrcamentoTelemovel: Story = {
  name: 'Novo orçamento — telemóvel',
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <MobileShell title="Novo orçamento" active="Orçamentos">
      <QuoteForm open={false} />
      <Button className="w-full">Guardar orçamento</Button>
    </MobileShell>
  ),
};

export const OrcamentoPublico: Story = {
  name: 'Orçamento visto pelo cliente (link)',
  render: () => (
    <div className="w-[800px] mx-auto bg-background p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Orçamento ORC-2026-014</h1>
          <p className="text-sm text-muted-foreground">João Silva · 912 345 678 · joao@email.pt</p>
          <p className="text-sm text-muted-foreground">Rua das Flores 12, 4000-100 Porto · NIF 234567890</p>
        </div>
        <StatusBadge status="enviado" />
      </div>
      <MaterialsTable />
      <div className="grid md:grid-cols-2 gap-4">
        <PaymentTermsCard
          paymentTerms={{ preset: '50_50', installments: [
            { label: 'Sinal', percent: 50, due_offset_days: 0 },
            { label: 'Conclusão', percent: 50, due_offset_days: 30 },
          ] }}
          total={2270.16}
          anchor={new Date('2026-09-21')}
        />
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <p className="text-xs uppercase font-bold text-primary">Dados de pagamento</p>
            <p>IBAN: PT50 0002 0123 1234 5678 9015 4</p>
            <p>MBWAY: 912 345 678</p>
          </CardContent>
        </Card>
      </div>
      <Button className="w-full gap-2"><Download className="h-4 w-4" /> Descarregar PDF</Button>
    </div>
  ),
};

export const LandingPage: Story = {
  name: 'Landing page',
  render: () => (
    <div className="w-[1280px] bg-background">
      <LandingNavbar />
      <section className="px-16 py-20 grid grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="font-heading text-5xl font-bold leading-tight">
            Crie orçamentos profissionais em minutos
          </h1>
          <p className="text-lg text-muted-foreground">
            Sem comissões, sem letras pequenas. Fica com 100% do que ganha em cada trabalho.
          </p>
          <div className="flex gap-3">
            <Button size="lg">Criar conta grátis</Button>
            <Button size="lg" variant="outline">Entrar</Button>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              'Orçamentos com tua marca e Condições',
              'Partilhe por WhatsApp, email ou link',
              'PDF gerado automaticamente, com IVA',
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-accent" /> ORC-2026-014</div>
            <MaterialsTable />
          </CardContent>
        </Card>
      </section>
    </div>
  ),
};
