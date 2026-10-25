import { useSyncExternalStore } from 'react';

import type { StepClock } from '@/lib/timing/clock';

/** Whole seconds elapsed. Re-renders once a second, not on every tick. */
export function useClockSeconds(clock: StepClock): number {
  return useSyncExternalStore(
    clock.subscribe,
    () => Math.floor(clock.elapsedMs() / 1000),
    () => 0,
  );
}

export function useClockRunning(clock: StepClock): boolean {
  return useSyncExternalStore(
    clock.subscribe,
    () => clock.running,
    () => false,
  );
}
