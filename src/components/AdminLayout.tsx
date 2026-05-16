import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Users, FileText, BarChart3, Layout, LogOut, LayoutDashboard, UserCog, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard, end: true },
  { title: 'Utilizadores', url: '/admin/users', icon: UserCog },
  { title: 'Leads', url: '/admin/leads', icon: Users },
  { title: 'Conteúdo', url: '/admin/content', icon: Layout },
  { title: 'Templates', url: '/admin/templates', icon: FileText },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
];

export default function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">A carregar...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 bg-card border-r border-border flex flex-col">
        <div className="p-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-heading text-lg font-bold text-foreground">Obreiro</div>
            <div className="text-xs text-muted-foreground">Backoffice</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
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
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="rounded-xl bg-muted/60 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Conta</div>
            <div className="text-sm font-medium truncate">{user.email}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/5"
            onClick={async () => { await signOut(); navigate('/admin'); }}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
