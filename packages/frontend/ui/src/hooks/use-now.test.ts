import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNow } from './use-now';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-25T10:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useNow', () => {
  it('starts at the current time', () => {
    const { result } = renderHook(() => useNow());
    expect(result.current).toBe(Date.parse('2026-10-25T10:00:00.000Z'));
  });

  it('advances once a second', () => {
    const { result } = renderHook(() => useNow());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(Date.parse('2026-10-25T10:00:03.000Z'));
  });

  it('shares one timer between every subscriber', () => {
    const first = renderHook(() => useNow());
    const second = renderHook(() => useNow());
    expect(vi.getTimerCount()).toBe(1);
    first.unmount();
    second.unmount();
  });

  it('stops the timer when the last subscriber leaves', () => {
    const { unmount } = renderHook(() => useNow());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('is null on the server, so markup never depends on the server clock', () => {
    function Probe() {
      return createElement('span', null, String(useNow()));
    }
    expect(renderToString(createElement(Probe))).toContain('null');
  });
});
