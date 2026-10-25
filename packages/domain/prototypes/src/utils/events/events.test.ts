import { describe, expect, it } from 'vitest';

import { newRecord } from '../new-record';
import { emptyRecords, putRecord } from '../record-tables';
import { addEvent, eventsOnDay, eventsThisWeek, localStartsAt } from './index';

const NOW = new Date(2026, 9, 21, 12).getTime(); // Wednesday
const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: NOW };
const event = (name: string, at: Date) => ({
  ...newRecord('event', name, ctx),
  startsAt: at.toISOString(),
});

describe('eventsThisWeek', () => {
  it('keeps this week only, earliest first', () => {
    let r = emptyRecords();
    r = putRecord(r, 'event', event('Later', new Date(2026, 9, 24, 9)));
    r = putRecord(r, 'event', event('Earlier', new Date(2026, 9, 19, 7)));
    r = putRecord(r, 'event', event('Next week', new Date(2026, 9, 26, 9)));
    expect(eventsThisWeek(r.event, NOW).map((e) => e.name)).toEqual([
      'Earlier',
      'Later',
    ]);
  });
});

describe('eventsOnDay', () => {
  it('keeps the given local day only, earliest first', () => {
    let r = emptyRecords();
    r = putRecord(r, 'event', event('Late', new Date(2026, 9, 21, 23, 30)));
    r = putRecord(r, 'event', event('Early', new Date(2026, 9, 21, 8)));
    r = putRecord(r, 'event', event('Next day', new Date(2026, 9, 22, 0, 15)));
    expect(eventsOnDay(r.event, '2026-10-21').map((e) => e.name)).toEqual([
      'Early',
      'Late',
    ]);
  });

  it('matches nothing for an invalid day', () => {
    let r = emptyRecords();
    r = putRecord(r, 'event', event('Any', new Date(2026, 9, 21, 9)));
    expect(eventsOnDay(r.event, 'someday')).toEqual([]);
  });
});

describe('localStartsAt', () => {
  it('reads a local day and time as that moment', () => {
    const at = new Date(localStartsAt('2026-10-21', '09:30')!);
    expect([at.getFullYear(), at.getMonth(), at.getDate()]).toEqual([
      2026, 9, 21,
    ]);
    expect([at.getHours(), at.getMinutes()]).toEqual([9, 30]);
  });

  it.each([
    ['2026-02-31', '09:00'],
    ['2026-10-21', '24:00'],
    ['2026-10-21', '9:00'],
    ['2026-10-21', '09:60'],
    ['someday', '09:00'],
    ['2026-10-21', ''],
  ])('rejects %s %s', (day, time) => {
    expect(localStartsAt(day, time)).toBeNull();
  });
});

describe('addEvent', () => {
  it('adds a trimmed event at its start time', () => {
    const startsAt = localStartsAt('2026-10-21', '09:30')!;
    const r = addEvent(emptyRecords(), '  Standup  ', startsAt, ctx);
    const [added] = Object.values(r.event);
    expect(added?.name).toBe('Standup');
    expect(added?.startsAt).toBe(startsAt);
    // It shows up on its day.
    expect(eventsOnDay(r.event, '2026-10-21').map((e) => e.name)).toEqual([
      'Standup',
    ]);
  });

  it('ignores a blank name and a bad timestamp', () => {
    const r = emptyRecords();
    expect(addEvent(r, '   ', '2026-10-21T09:30:00.000Z', ctx)).toBe(r);
    expect(addEvent(r, 'Standup', 'not a time', ctx)).toBe(r);
    // Parses as a date, but the saved record needs a full datetime.
    expect(addEvent(r, 'Standup', '2026-10-21', ctx)).toBe(r);
  });
});
