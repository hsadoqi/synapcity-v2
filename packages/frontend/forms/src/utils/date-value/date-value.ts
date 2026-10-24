const DATE_VALUE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Reads a form's `yyyy-MM-dd` string as a local date. The calendar parts are
 * checked rather than parsed as UTC, so the day never moves across time zones,
 * and an impossible date such as `2026-02-31` is `undefined`.
 */
export function fromDateValue(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const match = DATE_VALUE.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : undefined;
}

/** Writes a local date as the form's `yyyy-MM-dd` string. */
export function toDateValue(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** A date range as the form holds it: `to` is absent while only the start is picked. */
export interface DateRangeValue {
  readonly from: string;
  readonly to?: string;
}

/** Reads a form's `{ from, to }` value; anything without a valid start is `undefined`. */
export function fromDateRangeValue(
  value: unknown,
): { from: Date; to?: Date } | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const { from, to } = value as Record<string, unknown>;
  const start = fromDateValue(from);
  if (start === undefined) return undefined;
  const end = fromDateValue(to);
  return end === undefined ? { from: start } : { from: start, to: end };
}

/** Writes a picked range as the form's `{ from, to }` value; no start is `undefined`. */
export function toDateRangeValue(
  range: { from?: Date; to?: Date } | undefined,
): DateRangeValue | undefined {
  const from = toDateValue(range?.from);
  if (from === undefined) return undefined;
  const to = toDateValue(range?.to);
  return to === undefined ? { from } : { from, to };
}
