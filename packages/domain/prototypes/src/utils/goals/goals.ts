import type { Goal } from '../../types';

/** Whole-number completion percentage, capped at 100. */
export function goalPercent(goal: Pick<Goal, 'current' | 'target'>): number {
  if (goal.target <= 0) return 0;
  return Math.min(100, Math.round((goal.current / goal.target) * 100));
}
