const DAY = 86_400_000;

/** Calendar day (UTC midnight of the local y/m/d), so "yesterday" ignores the hour. */
function calendarDay(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * How recently something changed, in words a person would say: "Today",
 * "Yesterday", "3 days ago", then a plain date ("Oct 2", with the year once it
 * is not this one).
 */
export function formatEntityDate(at: string, now: Date = new Date()) {
  const then = new Date(at);
  const days = Math.round((calendarDay(now) - calendarDay(then)) / DAY);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return then.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: then.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}
