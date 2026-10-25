/*
 * A calendar date is a day with no time or zone, written `yyyy-MM-dd`.
 *
 * `new Date('2026-10-24')` reads that string as UTC midnight, so west of UTC it
 * shows the previous day; re-parsing a formatted label such as "Sat, Oct 24"
 * is worse, it has no year and lands in 2001. These helpers build the date
 * from its parts in local time and reject anything that is not a real day.
 */

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses `yyyy-MM-dd` as a local date, or returns `null` for anything else (including 2026-02-31). */
export function parseCalendarDate(date: string): Date | null {
  const match = CALENDAR_DATE.exec(date);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const result = new Date(year, month - 1, day);
  // `Date` rolls an impossible day over into the next month; reject it instead.
  const isSameDay =
    result.getFullYear() === year &&
    result.getMonth() === month - 1 &&
    result.getDate() === day;
  return isSameDay ? result : null;
}

export const DEFAULT_CALENDAR_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
};

/** Formats `yyyy-MM-dd` for display, or returns `null` when it is not a valid calendar date. */
export function formatCalendarDate(
  date: string,
  locale: Intl.LocalesArgument = 'en-US',
  format: Intl.DateTimeFormatOptions = DEFAULT_CALENDAR_DATE_FORMAT,
): string | null {
  return parseCalendarDate(date)?.toLocaleDateString(locale, format) ?? null;
}

const pad = (value: number, width: number) =>
  String(value).padStart(width, '0');

/** Writes a `Date` as `yyyy-MM-dd` in local time. */
export function toCalendarDate(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

/**
 * Moves a calendar date by whole days, or returns `null` when it is invalid.
 * Built from local parts, so a daylight-saving change never skips or repeats a day.
 */
export function addCalendarDays(date: string, days: number): string | null {
  const parsed = parseCalendarDate(date);
  if (!parsed) return null;
  return toCalendarDate(
    new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() + days),
  );
}
