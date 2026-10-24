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
