import { describe, expect, it } from 'vitest';
import { buildQuoteHtml, type QuoteRenderData } from './quotePdf';

const quote: QuoteRenderData = {
  title: 'Pintura <interior>', company: { name: 'Empresa', iban: 'PT50', mbway: '912345678' },
  client: { name: 'Cliente' }, createdAt: '2026-10-13',
  services: [{ name: 'Pintura', pricePerHour: 20, hours: 2, materials: [{ name: 'Tinta', quantity: 2, unit: 'L', unitPrice: 5 }] }],
  subtotal: 50, iva: 11.5, total: 61.5,
};

describe('online-aligned quote PDF', () => {
  it('uses item rows, embedded fonts and default payment terms without a column table', () => {
    const html = buildQuoteHtml(quote, { brand: null, withWatermark: false });
    expect(html).not.toContain('<table>');
    expect(html).toContain('class="item-row"');
    expect(html).toContain('Mão de obra');
    expect(html).toContain('2h ×');
    expect(html).toContain('Tinta');
    expect(html).toContain('data:font/ttf;base64,');
    expect(html).toContain('Formato de pagamento');
    expect(html).toContain('IBAN:');
    expect(html).toContain('MBWAY:');
    expect(html).toContain('Pintura &lt;interior&gt;');
  });
  it('escapes invalid brand colours while retaining valid primary/accent values', () => {
    const html = buildQuoteHtml(quote, { withWatermark: false, brand: {
      logoUrl: null, logoKind: 'horizontal', logoHeight: 64, primary: '#062039', accent: '</style><script>',
      description: null, terms: null, paymentConditions: null, validityDays: 30,
    } });
    expect(html).toContain('--brand-primary: #062039');
    expect(html).toContain('--brand-accent: #E8730A');
    expect(html).not.toContain('</style><script>');
  });
});