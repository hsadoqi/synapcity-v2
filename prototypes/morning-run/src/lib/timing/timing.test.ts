import { describe, expect, it, vi } from 'vitest';

import { BUILT_IN_RUNS } from '@/lib/runs/catalog';
import { BREATH_478, breathFrame, cycleSec, MIN_SCALE } from './breathing';
import { StepClock, remainingMs } from './clock';
import { formatClock, runDurationSec, runMeta } from './format';

describe('StepClock', () => {
  it('counts only while running and survives pause and resume', () => {
    let t = 1_000;
    const clock = new StepClock(() => t);
    expect(clock.elapsedMs()).toBe(0);
    clock.start();
    t += 4_000;
    expect(clock.elapsedMs()).toBe(4_000);
    clock.pause();
    t += 60_000;
    expect(clock.elapsedMs()).toBe(4_000);
    clock.start();
    t += 1_500;
    expect(clock.elapsedMs()).toBe(5_500);
  });

  it('can jump to a saved elapsed time and keep counting', () => {
    let t = 0;
    const clock = new StepClock(() => t);
    clock.start();
    clock.reset(12_000);
    t += 1_000;
    expect(clock.elapsedMs()).toBe(13_000);
  });

  it('stops itself at its limit and never runs past it', () => {
    let t = 0;
    const clock = new StepClock(() => t);
    clock.setLimit(30_000);
    clock.start();
    t += 29_000;
    expect(clock.expired).toBe(false);
    t += 5_000;
    expect(clock.elapsedMs()).toBe(30_000);
    expect(clock.expired).toBe(true);
    clock.tick();
    expect(clock.running).toBe(false);
    clock.start();
    expect(clock.running).toBe(false);
  });

  it('notifies subscribers on every change', () => {
    let t = 0;
    const clock = new StepClock(() => t, 1_000_000);
    const listener = vi.fn();
    const off = clock.subscribe(listener);
    clock.start();
    clock.pause();
    clock.reset(5_000);
    expect(listener).toHaveBeenCalledTimes(3);
    off();
  });

  it('never reports negative remaining time', () => {
    expect(remainingMs(30, 31_000)).toBe(0);
    expect(remainingMs(30, 10_000)).toBe(20_000);
  });
});

describe('run duration', () => {
  it('derives the card label from the same step durations the timer uses', () => {
    for (const run of BUILT_IN_RUNS) {
      const seconds = run.steps.reduce((a, s) => a + s.durationSec, 0);
      expect(runDurationSec(run)).toBe(seconds);
      expect(runMeta(run)).toContain(
        `about ${Math.max(1, Math.round(seconds / 60))} min`,
      );
    }
  });

  it('does not start every run at the same time', () => {
    const totals = new Set(BUILT_IN_RUNS.map(runDurationSec));
    expect(totals.size).toBeGreaterThan(4);
  });

  it('formats clocks', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(125)).toBe('2:05');
    expect(formatClock(29.2)).toBe('0:30');
    expect(formatClock(-4)).toBe('0:00');
  });
});

describe('breathFrame (4-7-8)', () => {
  it('is a 19 second cycle', () => {
    expect(cycleSec(BREATH_478)).toBe(19);
  });

  it('walks inhale, hold, exhale with a real countdown', () => {
    expect(breathFrame(0)).toMatchObject({
      phase: 'inhale',
      count: 4,
      cycle: 0,
    });
    expect(breathFrame(3_999)).toMatchObject({ phase: 'inhale', count: 1 });
    expect(breathFrame(4_000)).toMatchObject({ phase: 'hold', count: 7 });
    expect(breathFrame(10_500)).toMatchObject({ phase: 'hold', count: 1 });
    expect(breathFrame(11_000)).toMatchObject({ phase: 'exhale', count: 8 });
    expect(breathFrame(18_999)).toMatchObject({ phase: 'exhale', count: 1 });
    expect(breathFrame(19_000)).toMatchObject({
      phase: 'inhale',
      count: 4,
      cycle: 1,
    });
  });

  it('grows on inhale, holds full, and shrinks on exhale', () => {
    expect(breathFrame(0).scale).toBeCloseTo(MIN_SCALE);
    expect(breathFrame(2_000).scale).toBeGreaterThan(MIN_SCALE);
    expect(breathFrame(4_000).scale).toBe(1);
    expect(breathFrame(8_000).scale).toBe(1);
    expect(breathFrame(15_000).scale).toBeLessThan(1);
    expect(breathFrame(18_990).scale).toBeCloseTo(MIN_SCALE, 1);
  });
});
