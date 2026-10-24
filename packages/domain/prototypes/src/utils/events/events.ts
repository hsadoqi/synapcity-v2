import type { CalendarEvent, PrototypeRecords } from '../../types';
import { isSameWeek } from '../calendar';

/** Events in the week containing `now`, earliest first. */
export function eventsThisWeek(
  events: PrototypeRecords['event'],
  now: number,
): CalendarEvent[] {
  return Object.values(events)
    .filter((e) => isSameWeek(Date.parse(e.startsAt), now))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

/**
 * Events on the local calendar day `day` (`yyyy-MM-dd`), earliest first.
 * Compared by local date parts, so an event late in the evening stays on its
 * own day west of UTC. An invalid `day` matches nothing.
 */
export function eventsOnDay(
  events: PrototypeRecords['event'],
  day: string,
): CalendarEvent[] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return [];
  const [year, month, date] = [
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  ];
  return Object.values(events)
    .filter((e) => {
      const at = new Date(Date.parse(e.startsAt));
      return (
        at.getFullYear() === year &&
        at.getMonth() === month &&
        at.getDate() === date
      );
    })
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
