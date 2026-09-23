import type { Meta, StoryObj } from '@storybook/react';
import { FileText, Mail, MapPin, MoreHorizontal, Phone, Plus, Search, Trash2, UserCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/app/QuoteStatusBadge';

const meta: Meta = {
  title: 'Tabelas/Listagens',
  // Apenas estas exportações são stories; as restantes são dados e blocos reutilizáveis.
  includeStories: [
    'TabelaOrcamentos',
    'TabelaOrcamentosVazia',
    'TabelaMateriais',
    'TabelaClientes',
    'TabelaClientesVazia',
  ],
};
export default meta;
type Story = StoryObj;

const euro = (v: number) =>
  v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export const quotes = [
  { n: 'ORC-2026-014', cliente: 'João Silva', data: '21/09/2026', validade: '21/10/2026', total: 1845, status: 'enviado' as const },
  { n: 'ORC-2026-013', cliente: 'Maria Costa', data: '18/09/2026', validade: '18/10/2026', total: 620.5, status: 'aceite' as const },
  { n: 'ORC-2026-012', cliente: 'Café Central, Lda.', data: '12/09/2026', validade: '12/10/2026', total: 3210, status: 'visto' as const },
  { n: 'ORC-2026-011', cliente: 'Ana Pereira', data: '04/09/2026', validade: '04/10/2026', total: 480, status: 'rascunho' as const },
  { n: 'ORC-2026-010', cliente: 'Rui Marques', data: '29/08/2026', validade: '28/09/2026', total: 975.3, status: 'rejeitado' as const },
];

const filters = ['Todos', 'Rascunho', 'Enviado', 'Visto', 'Aceite', 'Rejeitado'];

export function QuotesToolbar({ active = 'Todos' }: { active?: string }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative max-w-sm w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Pesquisar orçamento ou cliente" />
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              f === active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}

export function QuotesTable({ rows = quotes }: { rows?: typeof quotes }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N.º</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="text-right">Total c/ IVA</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((q) => (
              <TableRow key={q.n} className="hover:bg-muted/60">
                <TableCell className="font-medium">{q.n}</TableCell>
                <TableCell>{q.cliente}</TableCell>
                <TableCell className="text-muted-foreground">{q.data}</TableCell>
                <TableCell className="text-muted-foreground">{q.validade}</TableCell>
                <TableCell className="text-right font-semibold">{euro(q.total)}</TableCell>
                <TableCell><StatusBadge status={q.status} /></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" aria-label="Ações">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
}: { icon?: any; title: string; description: string; action: string }) {
  return (
    <Card>
      <CardContent className="py-16 flex flex-col items-center text-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        <Button className="mt-2 gap-2"><Plus className="h-4 w-4" /> {action}</Button>
      </CardContent>
    </Card>
  );
}

export const TabelaOrcamentos: Story = {
  name: 'Orçamentos (com dados)',
  render: () => (
    <div className="space-y-4">
      <QuotesToolbar />
      <QuotesTable />
    </div>
  ),
};

export const TabelaOrcamentosVazia: Story = {
  name: 'Orçamentos (sem dados)',
  render: () => (
    <div className="space-y-4">
      <QuotesToolbar />
      <EmptyState
        title="Ainda não tem orçamentos"
        description="Crie o primeiro orçamento e partilhe por WhatsApp, email ou link."
        action="Criar orçamento"
      />
    </div>
  ),
};

export const materials = [
  { desc: 'Tinta plástica branca', qtd: 12, un: 'lt', preco: 9.5 },
  { desc: 'Massa de barrar', qtd: 4, un: 'kg', preco: 6.2 },
  { desc: 'Pintura de paredes interiores', qtd: 45, un: 'm²', preco: 8 },
  { desc: 'Mão de obra', qtd: 16, un: 'h', preco: 18 },
];

export function MaterialsTable() {
  const subtotal = materials.reduce((s, m) => s + m.qtd * m.preco, 0);
  const iva = subtotal * 0.23;
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead>Un.</TableHead>
              <TableHead className="text-right">Preço unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((m) => (
              <TableRow key={m.desc}>
                <TableCell className="font-medium">{m.desc}</TableCell>
                <TableCell className="text-right">{m.qtd}</TableCell>
                <TableCell className="text-muted-foreground">{m.un}</TableCell>
                <TableCell className="text-right">{euro(m.preco)}</TableCell>
                <TableCell className="text-right font-semibold">{euro(m.qtd * m.preco)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="gap-2 text-primary"><Plus className="h-4 w-4" /> Adicionar item</Button>
        </div>
        <div className="px-4 pb-4 space-y-1 text-sm max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal s/ IVA</span><span>{euro(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">IVA (23%)</span><span>{euro(iva)}</span></div>
          <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
            <span>Total</span><span className="text-accent">{euro(subtotal + iva)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const TabelaMateriais: Story = {
  name: 'Materiais e mão de obra',
  render: () => <MaterialsTable />,
};

export const clients = [
  { nome: 'João Silva', email: 'joao@email.pt', tel: '912 345 678', morada: 'Rua das Flores 12, Porto' },
  { nome: 'Maria Costa', email: 'maria@email.pt', tel: '936 112 908', morada: 'Av. da Liberdade 45, Lisboa' },
  { nome: 'Café Central, Lda.', email: 'geral@cafecentral.pt', tel: '213 456 789', morada: 'Praça do Comércio 3, Lisboa' },
];

export function ClientsTable() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Procurar por nome, email, telefone ou morada..." />
        </div>
        <div className="divide-y divide-border">
          <div className="hidden md:grid md:grid-cols-[2fr_2fr_2fr_auto_auto] gap-4 px-2 py-2 text-xs uppercase tracking-wide font-semibold text-muted-foreground">
            <div>Cliente</div><div>Contactos</div><div>Morada</div><div>Status RGPD</div><div />
          </div>
          {clients.map((c) => (
            <div key={c.email} className="grid md:grid-cols-[2fr_2fr_2fr_auto_auto] gap-4 px-2 py-4 items-center">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold uppercase text-sm">
                  {c.nome[0]}
                </div>
                <div className="font-semibold">{c.nome}</div>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {c.email}</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {c.tel}</div>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {c.morada}
              </div>
              <Badge variant="outline" className="bg-success-soft text-success-soft-foreground border-success/20 gap-1.5">
                <UserCheck className="h-3 w-3" /> Consentimento ativo
              </Badge>
              <Button variant="ghost" size="icon" aria-label="Eliminar" className="text-destructive hover:text-destructive hover:bg-destructive/5">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const TabelaClientes: Story = {
  name: 'Clientes (com dados)',
  render: () => <ClientsTable />,
};

export const TabelaClientesVazia: Story = {
  name: 'Clientes (sem dados)',
  render: () => (
    <EmptyState
      icon={Users}
      title="Ainda não tem clientes"
      description="Adicione um cliente para começar a criar orçamentos mais rápido."
      action="Adicionar cliente"
    />
  ),
};
