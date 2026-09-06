import { Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CollapsibleSection } from '@/components/app/CollapsibleSection';

interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface ClientSectionProps {
  clients: ClientRow[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  onNewClient: () => void;
  expanded: boolean;
  onToggle: () => void;
}

export function ClientSection({
  clients,
  selectedClientId,
  onSelectClient,
  onNewClient,
  expanded,
  onToggle,
}: ClientSectionProps) {
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <CollapsibleSection
      icon={Users}
      title="Cliente"
      summary={selectedClient ? `— ${selectedClient.name}` : undefined}
      open={expanded}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        <div>
          <Label>Selecionar cliente existente</Label>
          <Select
            value={selectedClientId}
            onValueChange={(v) => {
              if (v === '__new') {
                onNewClient();
                return;
              }
              onSelectClient(v);
            }}
          >
            <SelectTrigger><SelectValue placeholder="Escolher cliente..." /></SelectTrigger>
            <SelectContent>
              {clients.length === 0 && <div className="p-2 text-sm text-muted-foreground">Nenhum cliente ainda.</div>}
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              {clients.length > 0 && <div className="my-1 border-t" />}
              <SelectItem value="__new" className="text-primary font-medium">+ Novo Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedClient && (
          <div className="grid md:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 text-sm">
            <div><span className="text-muted-foreground">Email:</span> {selectedClient.email || '—'}</div>
            <div><span className="text-muted-foreground">Telefone:</span> {selectedClient.phone || '—'}</div>
            <div className="md:col-span-2"><span className="text-muted-foreground">Morada:</span> {selectedClient.address || '—'}</div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
