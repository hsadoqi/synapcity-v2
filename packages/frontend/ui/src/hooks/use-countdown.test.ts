import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCountdown } from './use-countdown';

const NOW = Date.parse('2026-10-25T10:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useCountdown', () => {
  it('reports the time left to a target', () => {
    const { result } = renderHook(() => useCountdown(NOW + 3_725_000));
    expect(result.current).toMatchObject({
      hours: 1,
      minutes: 2,
      seconds: 5,
      done: false,
      ready: true,
    });
  });

  it('counts down as the clock ticks', () => {
    const { result } = renderHook(() => useCountdown(NOW + 10_000));
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.seconds).toBe(6);
  });

  it('stops at zero and reports done', () => {
    const { result } = renderHook(() => useCountdown(NOW + 2000));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toMatchObject({
      hours: 0,
      minutes: 0,
      seconds: 0,
      remainingMs: 0,
      done: true,
    });
  });

  it('accepts a Date', () => {
    const { result } = renderHook(() => useCountdown(new Date(NOW + 61_000)));
    expect(result.current).toMatchObject({ minutes: 1, seconds: 1 });
  });

  it('treats a target already in the past as done', () => {
    const { result } = renderHook(() => useCountdown(NOW - 1));
    expect(result.current.done).toBe(true);
  });

  it('treats an invalid Date as done instead of showing NaN', () => {
    const { result } = renderHook(() => useCountdown(new Date('nope')));
    expect(result.current).toMatchObject({ seconds: 0, done: true });
  });
});
