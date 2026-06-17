export type PaymentPreset = '100_end' | '50_50' | '30_70' | '30d' | 'custom';

export interface PaymentInstallment {
  label: string;
  percent: number;       // 0-100
  due_offset_days: number; // days after anchor date
}

export interface PaymentTerms {
  preset: PaymentPreset;
  installments: PaymentInstallment[];
}

export const PAYMENT_PRESETS: { id: PaymentPreset; label: string; installments: PaymentInstallment[] }[] = [
  {
    id: '100_end',
    label: '100% à conclusão',
    installments: [{ label: 'Pagamento final', percent: 100, due_offset_days: 0 }],
  },
  {
    id: '50_50',
    label: '50% adiantamento + 50% final',
    installments: [
      { label: 'Adiantamento', percent: 50, due_offset_days: 0 },
      { label: 'Final', percent: 50, due_offset_days: 30 },
    ],
  },
  {
    id: '30_70',
    label: '30% adiantamento + 70% final',
    installments: [
      { label: 'Adiantamento', percent: 30, due_offset_days: 0 },
      { label: 'Final', percent: 70, due_offset_days: 30 },
    ],
  },
  {
    id: '30d',
    label: 'Pagamento a 30 dias',
    installments: [{ label: 'Pagamento único', percent: 100, due_offset_days: 30 }],
  },
  {
    id: 'custom',
    label: 'Personalizado',
    installments: [
      { label: 'Parcela 1', percent: 50, due_offset_days: 0 },
      { label: 'Parcela 2', percent: 50, due_offset_days: 30 },
    ],
  },
];

export const DEFAULT_PAYMENT_TERMS: PaymentTerms = {
  preset: '100_end',
  installments: PAYMENT_PRESETS[0].installments,
};

export function presetById(id: PaymentPreset) {
  return PAYMENT_PRESETS.find((p) => p.id === id) ?? PAYMENT_PRESETS[0];
}

export interface ExpandedInstallment {
  label: string;
  percent: number;
  amount: number;
  dueDate: Date;
}

export function expandInstallments(
  terms: PaymentTerms | null | undefined,
  total: number,
  anchor: Date | string | null | undefined
): ExpandedInstallment[] {
  const t = terms ?? DEFAULT_PAYMENT_TERMS;
  const base = anchor ? new Date(anchor) : new Date();
  return t.installments.map((i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + (i.due_offset_days || 0));
    return {
      label: i.label,
      percent: i.percent,
      amount: Math.round((total * i.percent) / 100 * 100) / 100,
      dueDate: d,
    };
  });
}

export function isWithinMonth(d: Date, ref: Date = new Date()) {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function totalPercent(terms: PaymentTerms) {
  return terms.installments.reduce((a, b) => a + (Number(b.percent) || 0), 0);
}
