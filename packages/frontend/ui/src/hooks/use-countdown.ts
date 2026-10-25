import { splitDuration } from '@synapcity/frontend-ui/lib/duration';
import type { DurationParts } from '@synapcity/frontend-ui/lib/duration';
import { useNow } from '@synapcity/frontend-ui/hooks/use-now';

export interface Countdown extends DurationParts {
  remainingMs: number;
  /** True once the target has passed, or when it is not a real date. */
  done: boolean;
  /** False until the browser clock is known, on the server and while hydrating. */
  ready: boolean;
}

/** Time left until `target`, ticking once a second and never going below zero. */
export function useCountdown(target: Date | number): Countdown {
  const now = useNow();
  if (now === null) {
    return { ...splitDuration(0), remainingMs: 0, done: false, ready: false };
  }
  const targetMs = typeof target === 'number' ? target : target.getTime();
  const remainingMs = Number.isFinite(targetMs)
    ? Math.max(0, targetMs - now)
    : 0;
  return {
    ...splitDuration(remainingMs),
    remainingMs,
    done: remainingMs === 0,
    ready: true,
  };
}
