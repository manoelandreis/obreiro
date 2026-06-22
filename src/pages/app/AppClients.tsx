import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Mail, Phone, MapPin, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { MobilePrimaryAction } from '@/components/app/MobilePrimaryAction';
import { ClientFormSheet } from '@/components/app/ClientFormSheet';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  rgpd_consent: boolean;
}

export default function AppClients() {
  const { user } = useAppAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('app_clients').select('*').order('name');
    if (data) setClients(data);
  };
  useEffect(() => { if (user) void load(); }, [user]);


  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este cliente? Os trabalhos associados ficarão sem cliente.')) return;
    const { error } = await supabase.from('app_clients').delete().eq('id', id);
    if (error) return toast.error('Erro a eliminar.');
    toast.success('Cliente eliminado.');
    void load();
  };

  const filtered = clients.filter((c) =>
    [c.name, c.email, c.phone, c.address].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerir contactos e conformidade RGPD.</p>
        </div>
        <MobilePrimaryAction
          label="Novo Cliente"
          onFloatingClick={() => setOpen(true)}
        >
          <Button className="gap-2 w-full md:w-auto" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Cliente
          </Button>
        </MobilePrimaryAction>
        <ClientFormSheet
          open={open}
          onOpenChange={setOpen}
          userId={user?.id}
          onCreated={() => void load()}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Procurar por nome, email, telefone ou morada..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nenhum cliente encontrado.</p>
          ) : (
            <div className="divide-y divide-border">
              <div className="hidden md:grid md:grid-cols-[2fr_2fr_2fr_auto_auto] gap-4 px-2 py-2 text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                <div>Cliente</div><div>Contactos</div><div>Morada</div><div>Status RGPD</div><div></div>
              </div>
              {filtered.map((c) => (
                <div key={c.id} className="grid md:grid-cols-[2fr_2fr_2fr_auto_auto] gap-4 px-2 py-4 items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold uppercase text-sm">
                      {c.name[0]}
                    </div>
                    <div className="font-semibold">{c.name}</div>
                  </div>
                  <div className="text-sm space-y-1">
                    {c.email && <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {c.email}</div>}
                    {c.phone && <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {c.phone}</div>}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    {c.address && <><MapPin className="h-3.5 w-3.5" /> {c.address}</>}
                  </div>
                  <Badge variant="outline" className="bg-success-soft text-success-soft-foreground border-success/20 gap-1.5"><UserCheck className="h-3 w-3" /> Consentimento ativo</Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive hover:bg-destructive/5">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
