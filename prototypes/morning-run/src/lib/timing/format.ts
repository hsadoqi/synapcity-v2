import type { Run } from '@/lib/runs/schema';

/** 125 -> "2:05". Negative and fractional input is clamped to whole seconds. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function runDurationSec(run: Pick<Run, 'steps'>): number {
  return run.steps.reduce((sum, step) => sum + step.durationSec, 0);
}

/** The label shown on a run card. It is derived from the same step durations the timer counts down. */
export function runMeta(run: Pick<Run, 'steps'>): string {
  const minutes = Math.max(1, Math.round(runDurationSec(run) / 60));
  const steps = run.steps.length;
  return `${steps} ${steps === 1 ? 'step' : 'steps'} · about ${minutes} min`;
}
