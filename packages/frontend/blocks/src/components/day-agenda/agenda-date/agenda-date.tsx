'use client';

import { useDateTimeFormatting } from '@synapcity/frontend-preferences';
import {
  DEFAULT_CALENDAR_DATE_FORMAT,
  formatCalendarDate,
  formatCalendarDay,
  parseCalendarDate,
} from '@synapcity/frontend-ui/lib/calendar-utils';
export interface AgendaDateProps {
  /** Calendar date as `yyyy-MM-dd`. */
  date: string;
  /**
   * Overrides the person's language for this date. With neither this nor
   * `format`, the date follows their regional settings ("Sat, Oct 24" or
   * "Sat 24 Oct").
   */
  locale?: Intl.LocalesArgument;
  /** Overrides the person's date format for this date. */
  format?: Intl.DateTimeFormatOptions;
}

/** A calendar date as text. An invalid date is shown as written, not as "Invalid Date". */
export const AgendaDate = ({ date, locale, format }: AgendaDateProps) => {
  const formatting = useDateTimeFormatting();
  const parsed = parseCalendarDate(date);
  const overridden = locale !== undefined || format !== undefined;
  const label = !parsed
    ? null
    : overridden
      ? formatCalendarDate(
          date,
          locale ?? formatting.locale,
          format ?? DEFAULT_CALENDAR_DATE_FORMAT,
        )
      : formatCalendarDay(parsed, formatting);
  return (
    <time
      dateTime={label ? date : undefined}
      className="text-xs font-semibold text-foreground/60"
    >
      {label ?? date}
    </time>
  );
};
