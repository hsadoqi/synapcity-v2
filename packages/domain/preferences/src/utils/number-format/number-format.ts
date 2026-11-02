import type { RegionalSettings } from '../../schemas';

type NumberFormat = RegionalSettings['numberFormat'];

// `grouping` picks the digit grouping: en-IN groups by lakh and crore (12,34,567).
// The space group is a narrow no-break space, as CLDR writes it, so a number
// never wraps between its digit groups.
const numberFormatParts: Record<
  NumberFormat,
  { group: string; decimal: string; grouping: 'en-US' | 'en-IN' }
> = {
  '1,000.00': { group: ',', decimal: '.', grouping: 'en-US' },
  '1.000,00': { group: '.', decimal: ',', grouping: 'en-US' },
  '1 000,00': { group: '\u202F', decimal: ',', grouping: 'en-US' },
  "1'000.00": { group: "'", decimal: '.', grouping: 'en-US' },
  '1,00,000.00': { group: ',', decimal: '.', grouping: 'en-IN' },
};

export type NumberFormatOptions = Pick<
  Intl.NumberFormatOptions,
  'minimumFractionDigits' | 'maximumFractionDigits'
>;

/**
 * A number written with the chosen grouping and decimal marks: 1234567.89 is
 * "1,234,567.89", "1.234.567,89" or "12,34,567.89". Every number the interface
 * shows goes through this, so the settings preview and the rest of the app
 * cannot disagree. Fraction digits follow `Intl.NumberFormat` unless given.
 */
export function formatNumber(
  value: number,
  numberFormat: NumberFormat,
  options: NumberFormatOptions = {},
): string {
  const { group, decimal, grouping } = numberFormatParts[numberFormat];
  return new Intl.NumberFormat(grouping, options)
    .formatToParts(value)
    .map((part) => {
      if (part.type === 'group') return group;
      if (part.type === 'decimal') return decimal;
      return part.value;
    })
    .join('');
}
