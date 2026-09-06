import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppAuth } from '@/hooks/useAppAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, LogOut, Lock, FileText, Building2, CircleUser, Sparkles, Menu, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import obreiroLogo from "@/assets/obreiro-logo.png.asset.json";

const nav = [
  { to: '/app/quotes', label: 'Orçamentos', icon: FileText },
  { to: '/app/clients', label: 'Clientes', icon: Users },
  { to: '/app/brand', label: 'Definições', icon: Building2 },
  { to: '/app/settings', label: 'Conta', icon: CircleUser },
  { to: '/app/planos', label: 'Planos', icon: Sparkles },
  { to: '/app/ajuda', label: 'Ajuda', icon: HelpCircle },
];

export default function AppLayout() {
  const { user, loading, signOut } = useAppAuth();
  const navigate = useNavigate();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Only read the boolean flag — never the hash — from the client.
    supabase.from('app_user_settings').select('pin_enabled').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.pin_enabled) {
          setPinEnabled(true);
          if (sessionStorage.getItem('app-unlocked') !== '1') {
            setLocked(true);
          }
        }
      });
  }, [user]);

  const lockNow = () => {
    if (pinEnabled) {
      sessionStorage.removeItem('app-unlocked');
      setLocked(true);
    } else {
      toast.info('Ative o PIN nas Definições para usar esta função.');
    }
  };

  const tryUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying) return;
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke('verify-pin', {
      body: { pin: pinInput },
    });
    setVerifying(false);
    if (error || !data?.ok) {
      toast.error('PIN incorreto.');
      setPinInput('');
      return;
    }
    sessionStorage.setItem('app-unlocked', '1');
    setLocked(false);
    setPinInput('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">A carregar...</div>;
  if (!user) return <Navigate to="/app/login" replace />;

  const sidebarContent = (
    <>
      <div className="p-5 flex items-center gap-2.5">
        {!logoError && (
          <div
            className="rounded-[10px] shadow-accent-glow overflow-hidden flex items-center justify-center bg-card shrink-0"
            style={{ width: 32, height: 32 }}
          >
            <img
              src={obreiroLogo.url}
              alt="Obreiro"
              className="w-full h-full object-contain"
              onError={() => setLogoError(true)}
            />
          </div>
        )}
        <span className="font-heading text-lg font-bold tracking-tight text-foreground">Obreiro</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <div className="rounded-xl bg-muted/60 p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/15" />
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Conta</div>
            <div className="text-sm font-medium truncate">{user.email}</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={lockNow}>
          <Lock className="h-4 w-4" /> Trancar App
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/5"
          onClick={async () => { await signOut(); navigate('/app/login'); }}
        >
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 shrink-0 bg-card border-r border-border flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 flex flex-col bg-card">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-card sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div
              className="rounded-[10px] shadow-accent-glow overflow-hidden flex items-center justify-center bg-card shrink-0"
              style={{ width: 32, height: 32 }}
            >
              <img
                src={obreiroLogo.url}
                alt="Obreiro"
                className="w-full h-full object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <span className="font-heading text-base font-bold tracking-tight">Obreiro</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-x-auto">
          <Outlet />
        </main>
      </div>


      {/* PIN lock overlay */}
      <Dialog open={locked} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> App trancada
            </DialogTitle>
            <DialogDescription>Introduza o PIN para continuar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={tryUnlock} className="space-y-4">
            <div>
              <Label>PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={verifying}>
              {verifying ? 'A verificar...' : 'Desbloquear'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
