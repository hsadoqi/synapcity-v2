import {
  calendarDaysBetween,
  formatRelativeDay,
  formatWrittenDate,
  type DateTimeFormatting,
} from '@synapcity/domain-preferences';

/** The year the instant falls in, in the person's zone. */
function yearIn(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric' }).format(
    date,
  );
}

/**
 * How recently something changed, in words a person would say: "Today",
 * "Yesterday", "3 days ago", then a written date ("Oct 2", with the year once
 * it is not this one). Days are calendar days in the person's zone, and the
 * date follows their chosen order ("2 Oct" for DD/MM/YYYY).
 */
export function formatEntityDate(
  at: string,
  formatting: DateTimeFormatting,
  now: Date = new Date(),
) {
  const then = new Date(at);
  const daysAgo = -calendarDaysBetween(now, then, formatting);

  if (daysAgo <= 0) return 'Today';
  if (daysAgo < 7) {
    return formatRelativeDay(then, now, formatting, { capitalize: true });
  }

  return formatWrittenDate(then, formatting, {
    weekday: false,
    year:
      yearIn(then, formatting.timeZone) !== yearIn(now, formatting.timeZone),
  });
}
