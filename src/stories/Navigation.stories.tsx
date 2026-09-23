import type { Meta, StoryObj } from '@storybook/react';
import {
  FileText, Users, Building2, CircleUser, Sparkles, HelpCircle, LogOut, Menu, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import obreiroLogo from '@/assets/obreiro-logo.png.asset.json';

const meta: Meta = { title: 'Navegação/Layout' };
export default meta;
type Story = StoryObj;

const nav = [
  { label: 'Orçamentos', icon: FileText },
  { label: 'Clientes', icon: Users },
  { label: 'Definições', icon: Building2 },
  { label: 'Conta', icon: CircleUser },
  { label: 'Planos', icon: Sparkles },
  { label: 'Ajuda', icon: HelpCircle },
];

function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-[10px] shadow-accent-glow overflow-hidden flex items-center justify-center bg-card shrink-0"
      style={{ width: size, height: size }}
    >
      <img src={obreiroLogo.url} alt="Obreiro" className="w-full h-full object-contain" />
    </div>
  );
}

export function SidebarDesktop({ active = 'Orçamentos' }: { active?: string }) {
  return (
    <aside className="w-64 h-[640px] bg-card border-r border-border flex flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
        <Logo />
        <span className="font-heading text-lg font-bold tracking-tight text-foreground">Obreiro</span>
        <Badge className="ml-auto">PRO</Badge>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <a
            key={item.label}
            href="#"
            onClick={(e) => e.preventDefault()}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
              item.label === active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </a>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="px-2 pb-3">
          <p className="text-sm font-medium text-foreground truncate">Manoel Andreis</p>
          <p className="text-xs text-muted-foreground truncate">manoel@obreiro.pt</p>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
          <LogOut className="h-5 w-5" /> Sair
        </Button>
      </div>
    </aside>
  );
}

export const BarraLateralComputador: Story = {
  name: 'Barra lateral (computador)',
  render: () => <SidebarDesktop />,
};

export function MobileTopBar({ title = 'Orçamentos' }: { title?: string }) {
  return (
    <header className="h-14 px-4 flex items-center gap-3 bg-card border-b border-border">
      <Button variant="ghost" size="icon" aria-label="Abrir menu">
        <Menu className="h-5 w-5" />
      </Button>
      <Logo />
      <span className="font-heading text-base font-bold text-foreground">{title}</span>
    </header>
  );
}

export function MobileBottomNav({ active = 'Orçamentos' }: { active?: string }) {
  const items = nav.slice(0, 4);
  return (
    <nav className="flex items-stretch border-t border-border bg-card">
      {items.map((item) => (
        <button
          key={item.label}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
            item.label === active ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export const NavegacaoTelemovel: Story = {
  name: 'Navegação (telemóvel)',
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <div className="w-[390px] h-[560px] flex flex-col border border-border rounded-xl overflow-hidden bg-background">
      <MobileTopBar />
      <div className="flex-1 p-4 text-sm text-muted-foreground">Conteúdo da página</div>
      <MobileBottomNav />
    </div>
  ),
};

export function LandingNavbar() {
  return (
    <header className="w-full flex items-center gap-6 px-6 h-16 bg-background border-b border-border">
      <div className="flex items-center gap-2">
        <Logo size={36} />
        <span className="font-heading text-xl font-bold text-foreground">Obreiro</span>
      </div>
      <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground ml-4">
        <a href="#" onClick={(e) => e.preventDefault()}>Como funciona</a>
        <a href="#" onClick={(e) => e.preventDefault()}>Vantagens</a>
        <a href="#" onClick={(e) => e.preventDefault()}>Perguntas</a>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost">Entrar</Button>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Criar conta grátis</Button>
      </div>
    </header>
  );
}

export const BarraLandingPage: Story = {
  name: 'Barra da landing page',
  render: () => <LandingNavbar />,
};
