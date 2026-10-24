const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Terse relative label: "Just now", "1 min ago", "12 min ago", "3 hr ago", "2 d ago". */
export function relativeTime(fromIso: string, now: number): string {
  const from = Date.parse(fromIso);
  const minutes = Math.round((now - from) / MINUTE);
  if (minutes <= 0) return 'Just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round((now - from) / DAY)} d ago`;
}
