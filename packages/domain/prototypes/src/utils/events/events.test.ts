import { describe, expect, it } from 'vitest';

import { newRecord } from '../new-record';
import { emptyRecords, putRecord } from '../record-tables';
import { eventsOnDay, eventsThisWeek } from './index';

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
