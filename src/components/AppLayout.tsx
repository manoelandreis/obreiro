import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppAuth } from '@/hooks/useAppAuth';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, LayoutGrid, Users, Settings, LogOut, Lock, FileText, Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/app/quotes', label: 'Orçamentos', icon: FileText },
  { to: '/app/jobs', label: 'Trabalhos', icon: Briefcase },
  { to: '/app/clients', label: 'Clientes', icon: Users },
  { to: '/app/brand', label: 'Marca', icon: Palette },
  { to: '/app/settings', label: 'Definições', icon: Settings },
  { to: '/app/planos', label: 'Planos', icon: Sparkles },
];

export default function AppLayout() {
  const { user, loading, signOut } = useAppAuth();
  const navigate = useNavigate();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [verifying, setVerifying] = useState(false);

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

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-card border-r border-border flex flex-col">
        <div className="p-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-bold text-foreground">HandyFlow</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-x-auto">
        <Outlet />
      </main>

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
