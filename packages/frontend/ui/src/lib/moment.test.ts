import { describe, expect, it } from 'vitest';

import {
  calendarDateIn,
  dayOffset,
  describeMoment,
  relativeDayLabel,
} from '@synapcity/frontend-ui/lib/moment';

// Intl writes the space before AM/PM as a narrow no-break space in recent ICU versions.
const plain = (text: string) => text.replace(/\s/g, ' ');

describe('calendarDateIn', () => {
  it('names the day it is in the given zone', () => {
    const instant = Date.UTC(2026, 3, 24, 1, 0);
    expect(calendarDateIn(instant, 'UTC')).toBe('2026-04-24');
    expect(calendarDateIn(instant, 'America/New_York')).toBe('2026-04-23');
    expect(calendarDateIn(Date.UTC(2026, 3, 23, 20, 0), 'Asia/Tokyo')).toBe(
      '2026-04-24',
    );
  });
});

describe('dayOffset', () => {
  it('counts calendar days, not 24-hour spans', () => {
    // 2026-03-08 is the day New York springs forward, so it is 23 hours long.
    const from = Date.UTC(2026, 2, 8, 5, 30); // 00:30 EST on the 8th
    const to = Date.UTC(2026, 2, 9, 4, 30); // 00:30 EDT on the 9th
    expect(dayOffset(from, to, 'America/New_York')).toBe(1);
  });

  it('is negative going back and zero within a day', () => {
    const noon = Date.UTC(2026, 3, 23, 12, 0);
    expect(dayOffset(noon, noon + 3_600_000, 'UTC')).toBe(0);
    expect(dayOffset(noon, noon - 2 * 86_400_000, 'UTC')).toBe(-2);
  });
});

describe('relativeDayLabel', () => {
  const now = Date.UTC(2026, 3, 23, 9, 0);
  const options = { locale: 'en-US', timeZone: 'UTC' };

  it.each([
    [0, 'Today'],
    [1, 'Tomorrow'],
    [-1, 'Yesterday'],
    [3, 'In 3 days'],
    [-2, '2 days ago'],
  ])('%j days away reads %j', (days, label) => {
    expect(relativeDayLabel(now + days * 86_400_000, now, options)).toBe(label);
  });

  it('gives nothing past the range', () => {
    expect(relativeDayLabel(now + 8 * 86_400_000, now, options)).toBeNull();
    expect(
      relativeDayLabel(now + 8 * 86_400_000, now, { ...options, maxDays: 10 }),
    ).toBe('In 8 days');
  });

  it('is written in the locale', () => {
    expect(relativeDayLabel(now, now, { ...options, locale: 'es' })).toBe(
      'Hoy',
    );
  });
});

describe('describeMoment', () => {
  const now = Date.UTC(2026, 3, 23, 9, 0);

  it('splits a moment into the parts a pill shows', () => {
    const parts = describeMoment(Date.UTC(2026, 3, 23, 14, 0), now, {
      locale: 'en-US',
      timeZone: 'UTC',
    });
    expect(parts && { ...parts, time: plain(parts.time) }).toEqual({
      weekday: 'Thu',
      date: 'Apr 23',
      time: '2:00 PM',
      relative: 'Today',
    });
  });

  it('reads the moment in the given zone', () => {
    const parts = describeMoment(Date.UTC(2026, 3, 23, 23, 30), now, {
      locale: 'en-US',
      timeZone: 'Asia/Tokyo',
    });
    expect(parts?.weekday).toBe('Fri');
    expect(parts?.date).toBe('Apr 24');
    expect(parts && plain(parts.time)).toBe('8:30 AM');
    expect(parts?.relative).toBe('Tomorrow');
  });

  it('accepts a Date', () => {
    expect(
      describeMoment(new Date(Date.UTC(2026, 3, 23, 14, 0)), now, {
        locale: 'en-US',
        timeZone: 'UTC',
      })?.date,
    ).toBe('Apr 23');
  });

  it('is null for a moment that is not a real date', () => {
    expect(describeMoment(new Date('nope'), now, {})).toBeNull();
    expect(describeMoment(Number.NaN, now, {})).toBeNull();
  });
});
