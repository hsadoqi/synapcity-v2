import {
  isSupportedTimezone,
  pageLanguage,
  SYSTEM_TIMEZONE,
  type RegionalSettings,
} from '../../schemas';

/** A week start as a day index, the way date-fns and react-day-picker count: Sunday is 0. */
export type WeekStart = 0 | 1 | 6;

/**
 * Regional settings resolved into what formatting needs. Every date and time
 * the interface shows is written from one of these, so the settings page's
 * preview and the rest of the app cannot disagree.
 */
export type DateTimeFormatting = {
  /**
   * The language words are written in (weekday and month names, "tomorrow").
   * It is the page's language, not the saved one, until the interface is
   * translated: a Japanese month name inside English text is read in the
   * wrong voice (WCAG 3.1.2), the same rule `pageLanguage` follows.
   */
  locale: string;
  /** An IANA zone, never `system`. */
  timeZone: string;
  hourCycle: 'h12' | 'h23';
  dateFormat: RegionalSettings['dateFormat'];
  weekStartsOn: WeekStart;
};

const weekStarts: Record<RegionalSettings['firstDayOfWeek'], WeekStart> = {
  sunday: 0,
  monday: 1,
  saturday: 6,
};

/**
 * Turns saved regional settings into formatting values. `deviceTimeZone` is
 * the zone `system` stands for: the browser's own, or on the server the last
 * one the account's device reported. An unknown zone falls back to UTC rather
 * than throwing while a page renders.
 */
export function resolveDateTimeFormatting(
  regional: Pick<
    RegionalSettings,
    'language' | 'timeFormat' | 'dateFormat' | 'timezone' | 'firstDayOfWeek'
  >,
  deviceTimeZone: string | null,
): DateTimeFormatting {
  const zone =
    regional.timezone === SYSTEM_TIMEZONE ? deviceTimeZone : regional.timezone;
  return {
    locale: pageLanguage(regional.language),
    timeZone: zone && isSupportedTimezone(zone) ? zone : 'UTC',
    hourCycle: regional.timeFormat === '12-hour' ? 'h12' : 'h23',
    dateFormat: regional.dateFormat,
    weekStartsOn: weekStarts[regional.firstDayOfWeek],
  };
}

/** The time of day, in the chosen hour cycle and zone: "2:05 PM" or "14:05". */
export function formatTime(date: Date, formatting: DateTimeFormatting): string {
  return new Intl.DateTimeFormat(formatting.locale, {
    timeZone: formatting.timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: formatting.hourCycle,
  }).format(date);
}

/** The day the instant falls on in `timeZone`, as its year, month and day. */
function dayParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? '';
  return { year: part('year'), month: part('month'), day: part('day') };
}

/** The date in figures, in the chosen order and zone: "04/23/2026", "23/04/2026" or "2026-04-23". */
export function formatDate(date: Date, formatting: DateTimeFormatting): string {
  const { year, month, day } = dayParts(date, formatting.timeZone);
  switch (formatting.dateFormat) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
  }
}

/**
 * The locale a date with a written month is formatted in. The saved order only
 * picks between English's two orders, "Apr 23" and "23 Apr"; `YYYY-MM-DD` has
 * no written form of its own and reads month first. Other languages keep their
 * own order once the interface is translated into them.
 */
function writtenDateLocale(formatting: DateTimeFormatting): string {
  if (formatting.locale !== 'en') return formatting.locale;
  return formatting.dateFormat === 'DD/MM/YYYY' ? 'en-GB' : 'en-US';
}

export type WrittenDateOptions = {
  /** @default true */
  weekday?: boolean;
  /** @default false */
  year?: boolean;
  /** @default 'short' */
  month?: 'short' | 'long';
};

/**
 * The date with its month written out, in the chosen order and zone:
 * "Thu, Apr 23" or "Thu 23 Apr", "April 23, 2026" or "23 April 2026".
 */
export function formatWrittenDate(
  date: Date,
  formatting: DateTimeFormatting,
  { weekday = true, year = false, month = 'short' }: WrittenDateOptions = {},
): string {
  return new Intl.DateTimeFormat(writtenDateLocale(formatting), {
    timeZone: formatting.timeZone,
    ...(weekday && { weekday: 'short' }),
    month,
    day: 'numeric',
    ...(year && { year: 'numeric' }),
  }).format(date);
}

/** Whole days from the epoch to the day the instant falls on in `timeZone`. */
function dayNumber(date: Date, timeZone: string): number {
  const { year, month, day } = dayParts(date, timeZone);
  return Date.UTC(Number(year), Number(month) - 1, Number(day)) / 86_400_000;
}

/**
 * How many calendar days `date` is from `now`, counted in the chosen zone, so
 * 23:30 tonight and 00:30 tomorrow are a day apart even though they are an
 * hour apart.
 */
export function calendarDaysBetween(
  now: Date,
  date: Date,
  formatting: DateTimeFormatting,
): number {
  return (
    dayNumber(date, formatting.timeZone) - dayNumber(now, formatting.timeZone)
  );
}

/**
 * The day relative to today: "today", "tomorrow", "yesterday", "in 3 days".
 * `capitalize` starts it with a capital, for a label that stands alone.
 */
export function formatRelativeDay(
  date: Date,
  now: Date,
  formatting: DateTimeFormatting,
  { capitalize = false }: { capitalize?: boolean } = {},
): string {
  const text = new Intl.RelativeTimeFormat(formatting.locale, {
    numeric: 'auto',
  }).format(calendarDaysBetween(now, date, formatting), 'day');
  return capitalize
    ? text.charAt(0).toLocaleUpperCase(formatting.locale) + text.slice(1)
    : text;
}
