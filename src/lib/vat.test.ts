import { describe, it, expect } from 'vitest';
import { vatRate, vatLabel, parseVatRegime } from './vat';
describe('vat', () => {
  it('normal is 23%', () => expect(vatRate('normal')).toBe(23));
  it('reduzida is 6%', () => expect(vatRate('reduzida')).toBe(6));
  it('intermedia is 13%', () => expect(vatRate('intermedia')).toBe(13));
  it('isento is 0%', () => expect(vatRate('isento')).toBe(0));
  it('old quotes default to 23%', () => { expect(parseVatRegime(undefined)).toBe('normal'); expect(vatLabel({})).toBe('IVA (23%)'); });
});
