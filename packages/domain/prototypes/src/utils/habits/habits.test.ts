import { describe, expect, it } from 'vitest';

import { dayKey } from '../calendar';
import { newRecord } from '../new-record';
import { emptyRecords, putRecord } from '../record-tables';
import { habitWeek, toggleHabitDay } from './index';

const NOW = new Date(2026, 9, 21, 12, 0).getTime(); // Wednesday
const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: NOW };

describe('habits', () => {
  it('toggles a day and reads the current Monday-first week', () => {
    const habit = { ...newRecord('habit', 'Meditate', ctx), completedDays: [] };
    let r = putRecord(emptyRecords(), 'habit', habit);
    r = toggleHabitDay(r, habit.id, dayKey(NOW), NOW);
    const week = habitWeek(r.habit[habit.id]!, NOW);
    expect(week.days).toHaveLength(7);
    expect(week.days[2]).toMatchObject({ done: true, isToday: true });
    expect(week.days[3]?.isFuture).toBe(true);
    expect(week.completed).toBe(1);
    r = toggleHabitDay(r, habit.id, dayKey(NOW), NOW);
    expect(r.habit[habit.id]?.completedDays).toEqual([]);
  });

  it('ignores a day that is not a YYYY-MM-DD key', () => {
    const habit = { ...newRecord('habit', 'Meditate', ctx), completedDays: [] };
    const r = putRecord(emptyRecords(), 'habit', habit);
    expect(toggleHabitDay(r, habit.id, '2026-10-21T00:00', NOW)).toBe(r);
    expect(toggleHabitDay(r, habit.id, 'monday', NOW)).toBe(r);
  });
});
