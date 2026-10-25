import type {
  CalendarEvent,
  PrototypeRecords,
  RecordContext,
} from '../../types';
import { calendarEventSchema } from '../../schemas';
import { isSameWeek } from '../calendar';
import { newRecord } from '../new-record';
import { putRecord } from '../record-tables';

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

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * The timestamp of a local calendar day (`yyyy-MM-dd`) and time (`HH:mm`), or
 * `null` when either is not real: 2026-02-31 is rejected rather than rolled
 * into March. A time that does not exist in the local zone (a daylight-saving
 * gap) moves to the nearest real one.
 */
export function localStartsAt(day: string, time: string): string | null {
  const d = DAY.exec(day);
  const t = TIME.exec(time);
  if (!d || !t) return null;
  const [year, month, date] = [Number(d[1]), Number(d[2]) - 1, Number(d[3])];
  const at = new Date(year, month, date, Number(t[1]), Number(t[2]));
  const sameDay =
    at.getFullYear() === year &&
    at.getMonth() === month &&
    at.getDate() === date;
  return sameDay ? at.toISOString() : null;
}

/**
 * Adds an event. A blank name, or a `startsAt` that is not an ISO datetime
 * with an offset (what the saved record requires), returns `records` unchanged.
 */
export function addEvent(
  records: PrototypeRecords,
  name: string,
  startsAt: string,
  ctx: RecordContext,
): PrototypeRecords {
  const trimmed = name.trim();
  // The schema's own check, so what is saved is what a load will accept.
  if (
    !trimmed ||
    !calendarEventSchema.shape.startsAt.safeParse(startsAt).success
  )
    return records;
  return putRecord(records, 'event', {
    ...newRecord('event', trimmed, ctx),
    startsAt,
  });
}
