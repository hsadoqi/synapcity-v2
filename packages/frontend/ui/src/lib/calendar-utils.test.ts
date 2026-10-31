import { describe, expect, it } from 'vitest';

import {
  regionalDefaults,
  resolveDateTimeFormatting,
} from '@synapcity/domain-preferences';
import {
  addCalendarDays,
  formatCalendarDate,
  formatCalendarDay,
  parseCalendarDate,
  toCalendarDate,
} from '@synapcity/frontend-ui/lib/calendar-utils';

describe('parseCalendarDate', () => {
  it('reads yyyy-MM-dd as that day in local time', () => {
    const date = parseCalendarDate('2026-10-24');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(9);
    expect(date?.getDate()).toBe(24);
    expect(date?.getHours()).toBe(0);
  });

  it.each([
    '',
    'Sat, Oct 24',
    '2026-10',
    '2026-1-5',
    '2026-02-31',
    '2026-13-01',
  ])('rejects %j', (input) => {
    expect(parseCalendarDate(input)).toBeNull();
  });
});

describe('formatCalendarDate', () => {
  it('formats a short weekday and day by default', () => {
    expect(formatCalendarDate('2026-10-24')).toBe('Sat, Oct 24');
  });

  it('takes a locale and format', () => {
    expect(
      formatCalendarDate('2026-10-24', 'en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    ).toBe('24 October');
  });

  it('returns null for an invalid date', () => {
    expect(formatCalendarDate('not a date')).toBeNull();
  });
});

describe('toCalendarDate', () => {
  it('writes a local date as yyyy-MM-dd', () => {
    expect(toCalendarDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('addCalendarDays', () => {
  it.each([
    ['2026-10-24', 1, '2026-10-25'],
    ['2026-10-24', -1, '2026-10-23'],
    ['2026-10-31', 1, '2026-11-01'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2028-02-28', 1, '2028-02-29'],
    // Across the US daylight-saving change (2026-11-01).
    ['2026-10-31', 2, '2026-11-02'],
  ])('%s + %i is %s', (date, days, expected) => {
    expect(addCalendarDays(date, days)).toBe(expected);
  });

  it('returns null for an invalid date', () => {
    expect(addCalendarDays('someday', 1)).toBeNull();
  });
});

describe('formatCalendarDay', () => {
  const formatting = (
    timezone: string,
    dateFormat = regionalDefaults.dateFormat,
  ) =>
    resolveDateTimeFormatting(
      { ...regionalDefaults, timezone, dateFormat },
      null,
    );
  const day = new Date(2026, 9, 24);

  it.each(['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'UTC'])(
    'keeps the same day in %s',
    (zone) => {
      expect(formatCalendarDay(day, formatting(zone))).toBe('Sat, Oct 24');
    },
  );

  it('follows the chosen date order and options', () => {
    expect(
      formatCalendarDay(day, formatting('UTC', 'DD/MM/YYYY'), {
        weekday: false,
        year: true,
        month: 'long',
      }),
    ).toBe('24 October 2026');
  });
});
