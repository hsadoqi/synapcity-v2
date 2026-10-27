import { describe, expect, it } from 'vitest';
import { regionalDefaults, type RegionalSettings } from '../../schemas';
import {
  calendarDaysBetween,
  formatDate,
  formatRelativeDay,
  formatWrittenDate,
  formatTime,
  resolveDateTimeFormatting,
} from './date-time';

const resolve = (regional: Partial<RegionalSettings>, device = 'UTC') =>
  resolveDateTimeFormatting({ ...regionalDefaults, ...regional }, device);

// 2026-04-23 18:05 UTC: 14:05 in New York, 03:05 on the 24th in Tokyo.
const instant = new Date('2026-04-23T18:05:00Z');

describe('resolveDateTimeFormatting', () => {
  it('uses the device zone for `system`', () => {
    expect(resolve({}, 'Europe/Paris').timeZone).toBe('Europe/Paris');
  });

  it('keeps a chosen zone over the device', () => {
    expect(resolve({ timezone: 'Asia/Tokyo' }, 'Europe/Paris').timeZone).toBe(
      'Asia/Tokyo',
    );
  });

  it('falls back to UTC for a missing or unknown device zone', () => {
    expect(resolveDateTimeFormatting(regionalDefaults, null).timeZone).toBe(
      'UTC',
    );
    expect(resolve({}, 'Mars/Olympus').timeZone).toBe('UTC');
  });

  it('writes words in the page language, not an untranslated saved one', () => {
    expect(resolve({ language: 'ja' }).locale).toBe('en');
  });

  it.each([
    ['sunday', 0],
    ['monday', 1],
    ['saturday', 6],
  ] as const)('starts the week on %s as day %i', (firstDayOfWeek, index) => {
    expect(resolve({ firstDayOfWeek }).weekStartsOn).toBe(index);
  });
});

describe('formatTime', () => {
  it('writes the chosen hour cycle in the chosen zone', () => {
    const zone = { timezone: 'America/New_York' };
    expect(
      formatTime(instant, resolve({ ...zone, timeFormat: '12-hour' })),
    ).toBe('2:05 PM');
    expect(
      formatTime(instant, resolve({ ...zone, timeFormat: '24-hour' })),
    ).toBe('14:05');
  });
});

describe('formatDate', () => {
  it.each([
    ['MM/DD/YYYY', '04/24/2026'],
    ['DD/MM/YYYY', '24/04/2026'],
    ['YYYY-MM-DD', '2026-04-24'],
  ] as const)('writes %s as the day falls in the zone', (dateFormat, text) => {
    expect(
      formatDate(instant, resolve({ dateFormat, timezone: 'Asia/Tokyo' })),
    ).toBe(text);
  });
});

describe('formatWrittenDate', () => {
  const zone = { timezone: 'America/New_York' };

  it('puts the month first, or the day first for DD/MM/YYYY', () => {
    expect(formatWrittenDate(instant, resolve(zone))).toBe('Thu, Apr 23');
    expect(
      formatWrittenDate(
        instant,
        resolve({ ...zone, dateFormat: 'DD/MM/YYYY' }),
      ),
    ).toBe('Thu 23 Apr');
    expect(
      formatWrittenDate(
        instant,
        resolve({ ...zone, dateFormat: 'YYYY-MM-DD' }),
      ),
    ).toBe('Thu, Apr 23');
  });

  it('writes the month in full when asked', () => {
    expect(
      formatWrittenDate(
        instant,
        resolve({ ...zone, dateFormat: 'DD/MM/YYYY' }),
        { weekday: false, year: true, month: 'long' },
      ),
    ).toBe('23 April 2026');
  });

  it('leaves out the weekday or adds the year when asked', () => {
    expect(
      formatWrittenDate(instant, resolve(zone), { weekday: false, year: true }),
    ).toBe('Apr 23, 2026');
  });
});

describe('relative days', () => {
  const tokyo = resolve({ timezone: 'Asia/Tokyo' });
  // 23:30 and 00:30 in Tokyo: an hour apart, a calendar day apart.
  const lateTonight = new Date('2026-04-23T14:30:00Z');
  const earlyTomorrow = new Date('2026-04-23T15:30:00Z');

  it('counts calendar days in the chosen zone, not 24-hour spans', () => {
    expect(calendarDaysBetween(lateTonight, earlyTomorrow, tokyo)).toBe(1);
    expect(
      calendarDaysBetween(
        lateTonight,
        earlyTomorrow,
        resolve({ timezone: 'UTC' }),
      ),
    ).toBe(0);
  });

  it('names nearby days and counts further ones', () => {
    expect(formatRelativeDay(lateTonight, lateTonight, tokyo)).toBe('today');
    expect(formatRelativeDay(earlyTomorrow, lateTonight, tokyo)).toBe(
      'tomorrow',
    );
    expect(
      formatRelativeDay(new Date('2026-04-20T03:00:00Z'), lateTonight, tokyo),
    ).toBe('3 days ago');
  });

  it('capitalizes a label that stands alone', () => {
    expect(
      formatRelativeDay(lateTonight, lateTonight, tokyo, { capitalize: true }),
    ).toBe('Today');
  });
});
