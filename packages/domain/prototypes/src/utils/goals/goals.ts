import type { Goal, PrototypeRecords } from '../../types';
import { putRecord, touchRecord } from '../record-tables';

/** Whole-number completion percentage, between 0 and 100. */
export function goalPercent(goal: Pick<Goal, 'current' | 'target'>): number {
  if (goal.target <= 0) return 0;
  return Math.min(
    100,
    Math.max(0, Math.round((goal.current / goal.target) * 100)),
  );
}

/**
 * Writes a goal's current and/or target value. Negative or non-finite values
 * are refused; a write that changes nothing returns `records` unchanged.
 */
export function updateGoal(
  records: PrototypeRecords,
  goalId: string,
  patch: { current?: number; target?: number },
  now: number,
): PrototypeRecords {
  const goal = records.goal[goalId];
  if (!goal) return records;
  const next = {
    current: patch.current ?? goal.current,
    target: patch.target ?? goal.target,
  };
  const valid = [next.current, next.target].every(
    (n) => Number.isFinite(n) && n >= 0,
  );
  if (!valid) return records;
  if (next.current === goal.current && next.target === goal.target) {
    return records;
  }
  return putRecord(records, 'goal', { ...touchRecord(goal, now), ...next });
}
