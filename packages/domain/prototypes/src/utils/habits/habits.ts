import type { Habit, PrototypeRecords } from '../../types';
import { DAY_KEY_PATTERN, dayKey, weekDayStarts } from '../calendar';
import { putRecord, touchRecord } from '../record-tables';

/** One day of a habit's week; its position in the week is its index (0 = Monday). */
export type HabitDay = {
  key: string;
  done: boolean;
  isToday: boolean;
  isFuture: boolean;
};

/** The current Monday-to-Sunday week of a habit. */
export function habitWeek(
  habit: Habit,
  now: number,
): { days: HabitDay[]; completed: number } {
  const done = new Set(habit.completedDays);
  const today = dayKey(now);
  const days = weekDayStarts(now).map((start) => {
    const key = dayKey(start);
    return {
      key,
      done: done.has(key),
      isToday: key === today,
      isFuture: key > today,
    };
  });
  return { days, completed: days.filter((d) => d.done).length };
}

/**
 * Marks `day` (YYYY-MM-DD) done, or undone when it already is. Anything that
 * is not a day key leaves `records` unchanged.
 */
export function toggleHabitDay(
  records: PrototypeRecords,
  habitId: string,
  day: string,
  now: number,
): PrototypeRecords {
  const habit = records.habit[habitId];
  if (!habit || !DAY_KEY_PATTERN.test(day)) return records;
  const completedDays = habit.completedDays.includes(day)
    ? habit.completedDays.filter((d) => d !== day)
    : [...habit.completedDays, day].sort();
  return putRecord(records, 'habit', {
    ...touchRecord(habit, now),
    completedDays,
  });
}
