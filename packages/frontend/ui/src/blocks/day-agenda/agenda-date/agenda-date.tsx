import {
  DEFAULT_CALENDAR_DATE_FORMAT,
  formatCalendarDate,
  parseCalendarDate,
} from '@synapcity/frontend-ui/lib/calendar-utils';

// Kept here so existing imports of it from this component still work.
export { parseCalendarDate };

export interface AgendaDateProps {
  /** Calendar date as `yyyy-MM-dd`. */
  date: string;
  /** @default 'en-US' */
  locale?: Intl.LocalesArgument;
  /** @default short weekday, short month, numeric day */
  format?: Intl.DateTimeFormatOptions;
}

/** A calendar date as text. An invalid date is shown as written, not as "Invalid Date". */
export const AgendaDate = ({
  date,
  locale = 'en-US',
  format = DEFAULT_CALENDAR_DATE_FORMAT,
}: AgendaDateProps) => {
  const label = formatCalendarDate(date, locale, format);
  return (
    <time
      dateTime={label ? date : undefined}
      className="text-xs font-semibold text-foreground/60"
    >
      {label ?? date}
    </time>
  );
};
