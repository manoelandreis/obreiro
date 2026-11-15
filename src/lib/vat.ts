export type VatRegime = 'normal' | 'intermedia' | 'reduzida' | 'isento' | 'autoliquidacao';

export const VAT_OPTIONS: { value: VatRegime; rate: number; label: string; note?: string }[] = [
  { value: 'normal', rate: 23, label: 'Normal — 23%' },
  { value: 'intermedia', rate: 13, label: 'Intermédia — 13%' },
  { value: 'reduzida', rate: 6, label: 'Reduzida — 6%', note: 'Ex.: empreitadas de reabilitação em habitação (verba 2.27 da Lista I do CIVA).' },
  { value: 'isento', rate: 0, label: 'Isento — 0%', note: 'IVA - regime de isenção (art.º 53.º do CIVA).' },
  { value: 'autoliquidacao', rate: 0, label: 'Autoliquidação — 0%', note: 'IVA - autoliquidação (art.º 2.º, n.º 1, al. j) do CIVA).' },
];

export const parseVatRegime = (v: unknown): VatRegime =>
  VAT_OPTIONS.some((o) => o.value === v) ? (v as VatRegime) : 'normal';

export const vatRate = (r: VatRegime) => VAT_OPTIONS.find((o) => o.value === r)!.rate;

/** Label for a stored quote: uses snapshot regime, falls back to 23% for old quotes. */
export function vatLabel(snapshot?: any): string {
  const o = VAT_OPTIONS.find((x) => x.value === parseVatRegime(snapshot?.vat_regime))!;
  if (o.value === 'isento') return 'IVA (isento)';
  if (o.value === 'autoliquidacao') return 'IVA (autoliquidação)';
  return `IVA (${o.rate}%)`;
}

export const vatNote = (snapshot?: any) =>
  VAT_OPTIONS.find((x) => x.value === parseVatRegime(snapshot?.vat_regime))?.note;
