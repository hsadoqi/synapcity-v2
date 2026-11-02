import { describe, expect, it } from 'vitest';
import { numberFormats } from '../../schemas';
import { formatNumber } from './number-format';

const twoDigits = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

describe('formatNumber', () => {
  it.each([
    ['1,000.00', '1,234,567.89'],
    ['1.000,00', '1.234.567,89'],
    ['1 000,00', '1\u202F234\u202F567,89'],
    ["1'000.00", "1'234'567.89"],
    ['1,00,000.00', '12,34,567.89'],
  ] as const)('writes %s as %s', (numberFormat, expected) => {
    expect(formatNumber(1234567.89, numberFormat, twoDigits)).toBe(expected);
  });

  it('writes every saved format', () => {
    for (const numberFormat of numberFormats) {
      expect(formatNumber(1000, numberFormat)).toMatch(/^1.?000$/u);
    }
  });

  it('never lets a number wrap between its digit groups', () => {
    expect(formatNumber(1000, '1 000,00')).not.toContain(' ');
  });

  it('leaves out fraction digits a whole number does not have', () => {
    expect(formatNumber(42, '1.000,00')).toBe('42');
  });

  it('keeps the sign of a negative number', () => {
    expect(formatNumber(-1500.5, '1.000,00')).toBe('-1.500,5');
  });
});
