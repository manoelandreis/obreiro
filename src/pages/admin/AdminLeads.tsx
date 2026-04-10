import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Users } from 'lucide-react';

interface Lead {
  id: string;
  name: string | null;
  email: string;
  source: string | null;
  created_at: string;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    supabase.from('waitlist_leads').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setLeads(data);
    });
  }, []);

  const exportCSV = () => {
    const csv = ['Name,Email,Source,Date', ...leads.map((l) => `"${l.name || ''}","${l.email}","${l.source || ''}","${new Date(l.created_at).toLocaleDateString('pt-PT')}"`),].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leads.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Leads & Waitlist</h1>
          <p className="text-muted-foreground">{leads.length} emails recolhidos</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2"><Download className="h-4 w-4" /> Exportar CSV</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.name || '—'}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell className="capitalize">{l.source?.replace('_', ' ') || '—'}</TableCell>
                  <TableCell>{new Date(l.created_at).toLocaleDateString('pt-PT')}</TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum lead ainda.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
