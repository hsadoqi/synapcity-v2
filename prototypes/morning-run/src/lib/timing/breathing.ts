export type BreathPattern = { inhale: number; hold: number; exhale: number };
export type BreathPhase = 'inhale' | 'hold' | 'exhale';

/** The 4-7-8 pattern from the prototype. One cycle is 19 seconds. */
export const BREATH_478: BreathPattern = { inhale: 4, hold: 7, exhale: 8 };
export const MIN_SCALE = 0.58;

export const cycleSec = (p: BreathPattern) => p.inhale + p.hold + p.exhale;

export type BreathFrame = {
  phase: BreathPhase;
  /** Whole seconds left in this phase, counting down to 1. */
  count: number;
  /** 0.58 when empty to 1 when full. Eased so the circle slows at both ends. */
  scale: number;
  /** Zero-based cycle number. */
  cycle: number;
};

const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

export function breathFrame(
  elapsedMs: number,
  pattern: BreathPattern = BREATH_478,
): BreathFrame {
  const total = cycleSec(pattern) * 1000;
  const ms = Math.max(0, elapsedMs);
  const cycle = Math.floor(ms / total);
  const t = ms - cycle * total;
  const inhale = pattern.inhale * 1000;
  const hold = pattern.hold * 1000;

  if (t < inhale) {
    return {
      phase: 'inhale',
      count: Math.ceil((inhale - t) / 1000),
      scale: MIN_SCALE + (1 - MIN_SCALE) * ease(t / inhale),
      cycle,
    };
  }
  if (t < inhale + hold) {
    return {
      phase: 'hold',
      count: Math.ceil((inhale + hold - t) / 1000),
      scale: 1,
      cycle,
    };
  }
  const exhaleT = t - inhale - hold;
  const exhale = pattern.exhale * 1000;
  return {
    phase: 'exhale',
    count: Math.ceil((exhale - exhaleT) / 1000),
    scale: 1 - (1 - MIN_SCALE) * ease(exhaleT / exhale),
    cycle,
  };
}

export const PHASE_LABEL: Record<BreathPhase, string> = {
  inhale: 'Inhale',
  hold: 'Hold',
  exhale: 'Exhale',
};

export function breathCycles(
  durationSec: number,
  pattern: BreathPattern = BREATH_478,
): number {
  return Math.max(1, Math.round(durationSec / cycleSec(pattern)));
}
