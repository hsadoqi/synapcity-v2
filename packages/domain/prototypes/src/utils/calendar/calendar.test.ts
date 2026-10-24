import { describe, expect, it } from 'vitest';

import {
  dayKey,
  isSameWeek,
  startOfWeek,
  weekDayStarts,
  weekdayIndex,
} from './index';

describe('calendar', () => {
  const sunday = new Date(2026, 9, 25, 23, 30).getTime();

  it('starts weeks on Monday', () => {
    expect(dayKey(startOfWeek(sunday))).toBe('2026-10-19');
    expect(weekDayStarts(sunday).map(dayKey)).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ]);
    expect(weekdayIndex(sunday)).toBe(6);
  });

  it('compares weeks, not days', () => {
    const monday = new Date(2026, 9, 19, 0, 0).getTime();
    expect(isSameWeek(monday, sunday)).toBe(true);
    expect(isSameWeek(monday - 1, sunday)).toBe(false);
  });
});
