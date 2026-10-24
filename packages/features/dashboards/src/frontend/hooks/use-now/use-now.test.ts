import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNow } from './index';

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-10-24T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns the current time and ticks every interval', () => {
    const { result } = renderHook(() => useNow(30_000));
    expect(result.current).toBe(Date.parse('2026-10-24T12:00:00Z'));
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current).toBe(Date.parse('2026-10-24T12:00:30Z'));
  });

  it('stops ticking when unmounted', () => {
    const { unmount } = renderHook(() => useNow(30_000));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starts no clock when the interval is null', () => {
    renderHook(() => useNow(null));
    expect(vi.getTimerCount()).toBe(0);
  });
});
