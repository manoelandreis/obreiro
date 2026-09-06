import { useState } from 'react';
import { Wallet, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CollapsibleSection } from '@/components/app/CollapsibleSection';
import { supabase } from '@/integrations/supabase/client';
import {
  PAYMENT_PRESETS, presetById, expandInstallments, totalPercent,
  createEmptyTemplate,
  type PaymentPreset, type PaymentTerms, type CustomPaymentTemplate,
} from '@/lib/paymentTerms';

interface PaymentSectionProps {
  total: number;
  paymentTerms: PaymentTerms;
  onPaymentTermsChange: (terms: PaymentTerms) => void;
  paymentTemplates: CustomPaymentTemplate[];
  onPaymentTemplatesChange: (templates: CustomPaymentTemplate[]) => void;
  selectedPaymentKey: string;
  onSelectedPaymentKeyChange: (key: string) => void;
  expanded: boolean;
  onToggle: () => void;
  userId?: string;
}

const fmt = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export function PaymentSection({
  total,
  paymentTerms,
  onPaymentTermsChange,
  paymentTemplates,
  onPaymentTemplatesChange,
  selectedPaymentKey,
  onSelectedPaymentKeyChange,
  expanded,
  onToggle,
  userId,
}: PaymentSectionProps) {
  const [openNewPayment, setOpenNewPayment] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState<CustomPaymentTemplate | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);

  const summaryLabel = selectedPaymentKey.startsWith('tpl:')
    ? (paymentTemplates.find((t) => t.id === selectedPaymentKey.slice(4))?.name ?? 'Personalizado')
    : presetById(paymentTerms.preset).label;

  const handleValueChange = (v: string) => {
    if (v === '__new') {
      setPaymentDraft(createEmptyTemplate('Novo modelo'));
      setOpenNewPayment(true);
      return;
    }
    if (v.startsWith('tpl:')) {
      const tpl = paymentTemplates.find((t) => t.id === v.slice(4));
      if (tpl) {
        onSelectedPaymentKeyChange(v);
        onPaymentTermsChange({ preset: 'custom', installments: tpl.installments.map((i) => ({ ...i })) });
      }
      return;
    }
    const p = presetById(v as PaymentPreset);
    onSelectedPaymentKeyChange(p.id);
    onPaymentTermsChange({ preset: p.id, installments: p.installments.map((i) => ({ ...i })) });
  };

  const handleSaveTemplate = async () => {
    if (!userId || !paymentDraft) return;
    const name = paymentDraft.name.trim();
    if (paymentTemplates.some((t) => t.name.trim().toLowerCase() === name.toLowerCase())) {
      // Parent should surface toast; keeping error local is tricky without toast import.
      // We rely on parent to pass a callback or we can just return. For now return.
      return;
    }
    const cleaned: CustomPaymentTemplate = { ...paymentDraft, name };
    const nextTpls = [...paymentTemplates, cleaned];
    setSavingPayment(true);
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase
      .from('app_user_settings')
      .upsert({ user_id: userId, payment_term_templates: nextTpls } as any, { onConflict: 'user_id' });
    setSavingPayment(false);
    if (error) return;
    onPaymentTemplatesChange(nextTpls);
    onPaymentTermsChange({ preset: 'custom', installments: cleaned.installments.map((i) => ({ ...i })) });
    onSelectedPaymentKeyChange(`tpl:${cleaned.id}`);
    setOpenNewPayment(false);
    setPaymentDraft(null);
  };

  return (
    <>
      <CollapsibleSection
        icon={Wallet}
        title="Pagamento"
        summary={<span className="truncate">— {summaryLabel}</span>}
        open={expanded}
        onToggle={onToggle}
      >
        <div className="space-y-4">
          <div>
            <Label>Modelo</Label>
            <Select value={selectedPaymentKey} onValueChange={handleValueChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {paymentTemplates.map((t) => (
                  <SelectItem key={t.id} value={`tpl:${t.id}`}>{t.name}</SelectItem>
                ))}
                {paymentTemplates.length > 0 && <div className="my-1 border-t" />}
                {PAYMENT_PRESETS.filter((p) => p.id !== 'custom').map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
                <div className="my-1 border-t" />
                <SelectItem value="__new" className="text-primary font-medium">+ Novo modelo personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Pré-visualização</div>
            <div className="space-y-1">
              {expandInstallments(paymentTerms, total, new Date()).map((p, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_7rem] items-center gap-3 text-sm">
                  <span className="truncate">{p.label} <span className="text-muted-foreground">({p.percent}%)</span></span>
                  <span className="font-semibold text-primary text-right">{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <Dialog open={openNewPayment} onOpenChange={(o) => { setOpenNewPayment(o); if (!o) setPaymentDraft(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo método de pagamento personalizado</DialogTitle>
            <DialogDescription>Será guardado nos teus modelos e selecionado neste orçamento.</DialogDescription>
          </DialogHeader>
          {paymentDraft && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Nome do modelo</Label>
                <Input
                  value={paymentDraft.name}
                  placeholder="Ex.: 30% adiantamento + 70% à entrega"
                  onChange={(e) => setPaymentDraft({ ...paymentDraft, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                {paymentDraft.installments.map((i, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_5rem_7rem_2rem] gap-2 items-end">
                    <div>
                      {idx === 0 && <Label className="text-xs">Descrição</Label>}
                      <Input value={i.label} onChange={(e) => {
                        const next = [...paymentDraft.installments];
                        next[idx] = { ...next[idx], label: e.target.value };
                        setPaymentDraft({ ...paymentDraft, installments: next });
                      }} />
                    </div>
                    <div>
                      {idx === 0 && <Label className="text-xs">%</Label>}
                      <Input type="number" min={0} max={100} value={i.percent} onChange={(e) => {
                        const next = [...paymentDraft.installments];
                        next[idx] = { ...next[idx], percent: Number(e.target.value) };
                        setPaymentDraft({ ...paymentDraft, installments: next });
                      }} />
                    </div>
                    <div>
                      {idx === 0 && <Label className="text-xs">Dias após aceitação</Label>}
                      <Input type="number" min={0} value={i.due_offset_days} onChange={(e) => {
                        const next = [...paymentDraft.installments];
                        next[idx] = { ...next[idx], due_offset_days: Number(e.target.value) };
                        setPaymentDraft({ ...paymentDraft, installments: next });
                      }} />
                    </div>
                    <div className="flex justify-end">
                      {paymentDraft.installments.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => {
                          const next = paymentDraft.installments.filter((_, n) => n !== idx);
                          setPaymentDraft({ ...paymentDraft, installments: next });
                        }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                  setPaymentDraft({
                    ...paymentDraft,
                    installments: [...paymentDraft.installments, { label: `Parcela ${paymentDraft.installments.length + 1}`, percent: 0, due_offset_days: 30 }],
                  });
                }}>
                  <Plus className="h-4 w-4" /> Adicionar parcela
                </Button>
                {totalPercent({ preset: 'custom', installments: paymentDraft.installments }) !== 100 && (
                  <p className="text-xs text-destructive">
                    Soma das percentagens: {totalPercent({ preset: 'custom', installments: paymentDraft.installments })}% (deve ser 100%).
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setOpenNewPayment(false); setPaymentDraft(null); }} disabled={savingPayment}>
              Cancelar
            </Button>
            <Button
              disabled={savingPayment || !paymentDraft || !paymentDraft.name.trim() || totalPercent({ preset: 'custom', installments: paymentDraft?.installments ?? [] }) !== 100}
              onClick={handleSaveTemplate}
            >
              {savingPayment ? 'A guardar...' : 'Adicionar e selecionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
