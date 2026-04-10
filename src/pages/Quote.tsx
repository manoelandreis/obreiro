import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, ArrowRight, Download, Building2 } from 'lucide-react';

interface QuoteItem {
  id: string;
  service: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  nif: string;
}

interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface QuoteTemplate {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  default_price: number | null;
  category: string | null;
}

const emptyItem = (): QuoteItem => ({
  id: crypto.randomUUID(),
  service: '',
  description: '',
  quantity: 1,
  unit: 'un',
  unitPrice: 0,
});

export default function Quote() {
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState<CompanyInfo>({ name: '', email: '', phone: '', address: '', nif: '' });
  const [client, setClient] = useState<ClientInfo>({ name: '', email: '', phone: '', address: '' });
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()]);
  const [notes, setNotes] = useState('');
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('quote_templates').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setTemplates(data as QuoteTemplate[]);
    });
  }, []);

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (id: string) => setItems(items.filter((i) => i.id !== id));
  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const addFromTemplate = (t: QuoteTemplate) => {
    setItems([...items, {
      id: crypto.randomUUID(),
      service: t.name,
      description: t.description || '',
      quantity: 1,
      unit: t.unit || 'un',
      unitPrice: Number(t.default_price) || 0,
    }]);
  };

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const iva = subtotal * 0.23;
  const total = subtotal + iva;

  const handleDownloadPDF = async () => {
    // Log the quote
    await supabase.from('quote_logs').insert({
      company_name: company.name,
      client_name: client.name,
      total_amount: total,
      items_count: items.length,
    });

    // Use browser print as PDF
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up bloqueado. Permita pop-ups para fazer download.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Orçamento - ${company.name || 'HandyFlow'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: 700; color: #3b82f6; }
            .info-block { margin-bottom: 20px; }
            .info-block h3 { font-size: 14px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
            .info-block p { font-size: 14px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .totals { text-align: right; margin-top: 20px; }
            .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; font-size: 14px; }
            .totals .total { font-size: 18px; font-weight: 700; color: #3b82f6; border-top: 2px solid #3b82f6; padding-top: 8px; margin-top: 8px; }
            .notes { margin-top: 30px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 13px; color: #475569; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer">Gerado com HandyFlow — handyflow.app</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleWaitlistNudge = async () => {
    if (!waitlistEmail) return;
    await supabase.from('waitlist_leads').insert({ email: waitlistEmail, source: 'quote_tool' });
    toast.success('Obrigado! Ficou na lista de espera.');
    setWaitlistEmail('');
  };

  const fmt = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-heading text-xl font-bold text-primary">HandyFlow</Link>
          <span className="text-sm text-muted-foreground">Gerador de Orçamentos</span>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Company Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Dados da Sua Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Nome da Empresa</Label><Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="Ex: Silva Construções" /></div>
                <div><Label>NIF</Label><Input value={company.nif} onChange={(e) => setCompany({ ...company, nif: e.target.value })} placeholder="Ex: 123456789" /></div>
                <div><Label>Email</Label><Input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} /></div>
              </div>
              <div><Label>Morada</Label><Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} /></div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} className="gap-2">Seguinte <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Client Info */}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle>Dados do Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Nome do Cliente</Label><Input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} /></div>
                <div><Label>Morada</Label><Input value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} /></div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Anterior</Button>
                <Button onClick={() => setStep(3)} className="gap-2">Seguinte <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Line Items */}
        {step === 3 && (
          <Card>
            <CardHeader><CardTitle>Itens do Orçamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {templates.length > 0 && (
                <div className="mb-4">
                  <Label className="text-muted-foreground text-xs mb-2 block">Adicionar a partir de template:</Label>
                  <div className="flex flex-wrap gap-2">
                    {templates.map((t) => (
                      <Button key={t.id} variant="outline" size="sm" onClick={() => addFromTemplate(t)}>
                        + {t.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {items.map((item, idx) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Item {idx + 1}</span>
                    {items.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div><Label>Serviço</Label><Input value={item.service} onChange={(e) => updateItem(item.id, 'service', e.target.value)} placeholder="Ex: Pintura Interior" /></div>
                    <div><Label>Descrição</Label><Input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Qtd</Label><Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} /></div>
                    <div><Label>Unidade</Label><Input value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} /></div>
                    <div><Label>Preço Unit. (€)</Label><Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))} /></div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    Subtotal: <span className="font-medium text-foreground">{fmt(item.quantity * item.unitPrice)}</span>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addItem} className="gap-2 w-full"><Plus className="h-4 w-4" /> Adicionar Item</Button>

              <div><Label>Notas / Termos e Condições</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Pagamento a 30 dias..." rows={3} /></div>

              <div className="border-t pt-4 space-y-1 text-right">
                <p className="text-sm text-muted-foreground">Subtotal: {fmt(subtotal)}</p>
                <p className="text-sm text-muted-foreground">IVA (23%): {fmt(iva)}</p>
                <p className="text-lg font-bold text-foreground">Total: {fmt(total)}</p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Anterior</Button>
                <Button onClick={() => setStep(4)} className="gap-2">Ver Preview <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div ref={printRef}>
                  <div className="header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, borderBottom: '3px solid #3b82f6', paddingBottom: 16 }}>
                    <div>
                      <div className="company-name" style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{company.name || 'A Sua Empresa'}</div>
                      {company.nif && <p style={{ fontSize: 13, color: '#6b7280' }}>NIF: {company.nif}</p>}
                      {company.email && <p style={{ fontSize: 13, color: '#6b7280' }}>{company.email}</p>}
                      {company.phone && <p style={{ fontSize: 13, color: '#6b7280' }}>{company.phone}</p>}
                      {company.address && <p style={{ fontSize: 13, color: '#6b7280' }}>{company.address}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>ORÇAMENTO</h2>
                      <p style={{ fontSize: 13, color: '#6b7280' }}>Data: {new Date().toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>

                  <div className="info-block" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Cliente</h3>
                    <p style={{ fontSize: 14 }}><strong>{client.name}</strong></p>
                    {client.email && <p style={{ fontSize: 13, color: '#475569' }}>{client.email}</p>}
                    {client.phone && <p style={{ fontSize: 13, color: '#475569' }}>{client.phone}</p>}
                    {client.address && <p style={{ fontSize: 13, color: '#475569' }}>{client.address}</p>}
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#f1f5f9', textAlign: 'left', padding: '10px 12px', fontSize: 12, textTransform: 'uppercase', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Serviço</th>
                        <th style={{ background: '#f1f5f9', textAlign: 'left', padding: '10px 12px', fontSize: 12, textTransform: 'uppercase', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Descrição</th>
                        <th style={{ background: '#f1f5f9', textAlign: 'center', padding: '10px 12px', fontSize: 12, textTransform: 'uppercase', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Qtd</th>
                        <th style={{ background: '#f1f5f9', textAlign: 'right', padding: '10px 12px', fontSize: 12, textTransform: 'uppercase', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Preço Unit.</th>
                        <th style={{ background: '#f1f5f9', textAlign: 'right', padding: '10px 12px', fontSize: 12, textTransform: 'uppercase', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 14 }}>{item.service}</td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 14, color: '#475569' }}>{item.description}</td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 14, textAlign: 'center' }}>{item.quantity} {item.unit}</td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 14, textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 14, textAlign: 'right', fontWeight: 600 }}>{fmt(item.quantity * item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ textAlign: 'right', marginTop: 16 }}>
                    <p style={{ fontSize: 14, color: '#475569' }}>Subtotal: {fmt(subtotal)}</p>
                    <p style={{ fontSize: 14, color: '#475569' }}>IVA (23%): {fmt(iva)}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6', borderTop: '2px solid #3b82f6', paddingTop: 8, marginTop: 8, display: 'inline-block' }}>Total: {fmt(total)}</p>
                  </div>

                  {notes && (
                    <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569' }}>
                      <strong>Notas:</strong><br />{notes}
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6 border-t pt-4">
                  <Button variant="outline" onClick={() => setStep(3)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Editar</Button>
                  <Button onClick={handleDownloadPDF} className="gap-2"><Download className="h-4 w-4" /> Download PDF</Button>
                </div>
              </CardContent>
            </Card>

            {/* Waitlist nudge */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 text-center">
                <p className="font-heading font-semibold text-lg mb-2">Gostou? O melhor ainda está por vir!</p>
                <p className="text-sm text-muted-foreground mb-4">Deixe o seu email para saber quando lançarmos o app completo com gestão de clientes, projetos e muito mais.</p>
                <div className="flex gap-2 max-w-md mx-auto">
                  <Input type="email" placeholder="O seu email" value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} />
                  <Button onClick={handleWaitlistNudge}>Juntar-me</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
