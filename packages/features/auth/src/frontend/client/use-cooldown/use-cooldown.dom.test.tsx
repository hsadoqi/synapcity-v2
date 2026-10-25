import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCooldown } from './use-cooldown';
import type { AuthState } from '@synapcity/features-auth/contracts';

const idle: AuthState = {};
const accepted = (): AuthState => ({ success: true });

describe('useCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at the full wait, or free when no email was just sent', () => {
    expect(renderHook(() => useCooldown(idle, true, 5)).result.current).toBe(5);
    expect(renderHook(() => useCooldown(idle, false, 5)).result.current).toBe(
      0,
    );
  });

  it('counts down once a second and stops at zero', () => {
    const { result } = renderHook(() => useCooldown(idle, true, 3));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(2);
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(0);
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(0);
  });

  it('restarts after an accepted result but not after a failed one', () => {
    const { result, rerender } = renderHook(
      ({ state }) => useCooldown(state, true, 3),
      { initialProps: { state: idle } },
    );
    for (let tick = 0; tick < 3; tick += 1) {
      act(() => vi.advanceTimersByTime(1000));
    }
    expect(result.current).toBe(0);

    rerender({ state: { error: 'Too many attempts' } });
    expect(result.current).toBe(0);

    rerender({ state: accepted() });
    expect(result.current).toBe(3);
  });

  it('clears its timer on unmount', () => {
    const { unmount } = renderHook(() => useCooldown(idle, true, 3));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
