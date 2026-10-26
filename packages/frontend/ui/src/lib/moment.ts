/*
 * A moment is one instant, read in a zone: "Thu, Apr 23, 2:00 PM" and "today".
 * `calendar-date.ts` is the other kind of date, a day with no time or zone.
 * Day arithmetic goes through the zone's calendar day, so a 23-hour day when
 * the clocks change still counts as one day.
 *
 * `timeZone` is an IANA name such as `America/New_York`. Left out, it is the
 * runtime's zone. An unknown name makes Intl throw a RangeError, which is a
 * mistake in the caller and is not hidden.
 */

const DAY_MS = 86_400_000;

export interface MomentOptions {
  locale?: Intl.LocalesArgument;
  timeZone?: string;
  /** 12- or 24-hour time. Left out, the locale's own habit. */
  hourCycle?: 'h12' | 'h23';
}

/** The day an instant falls on in the zone, as `yyyy-MM-dd`. */
export function calendarDateIn(instant: number, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const part = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function dayNumber(instant: number, timeZone?: string): number {
  const [year = 0, month = 1, day = 1] = calendarDateIn(instant, timeZone)
    .split('-')
    .map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

/** Whole calendar days from one instant to another in the zone; negative going back. */
export function dayOffset(from: number, to: number, timeZone?: string): number {
  return dayNumber(to, timeZone) - dayNumber(from, timeZone);
}

function capitalize(text: string, locale?: Intl.LocalesArgument): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/**
 * "Today", "Tomorrow", "Yesterday", then "In 3 days" or "2 days ago" up to
 * `maxDays` (7) away, written in the locale. Further away it is `null`.
 */
export function relativeDayLabel(
  instant: number,
  now: number,
  { locale, timeZone, maxDays = 7 }: MomentOptions & { maxDays?: number } = {},
): string | null {
  const offset = dayOffset(now, instant, timeZone);
  if (Math.abs(offset) > maxDays) return null;
  const label = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    offset,
    'day',
  );
  return capitalize(label, locale);
}

export interface MomentParts {
  weekday: string;
  date: string;
  time: string;
  relative: string | null;
}

/** The parts of a moment a date pill shows, or `null` when it is not a real date. */
export function describeMoment(
  value: Date | number,
  now: number,
  options: MomentOptions = {},
): MomentParts | null {
  const instant = typeof value === 'number' ? value : value.getTime();
  if (!Number.isFinite(instant)) return null;
  const { locale, timeZone, hourCycle } = options;
  const format = (format: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone, ...format }).format(instant);
  return {
    weekday: format({ weekday: 'short' }),
    date: format({ month: 'short', day: 'numeric' }),
    time: format({ timeStyle: 'short', hourCycle }),
    relative: relativeDayLabel(instant, now, options),
  };
}
