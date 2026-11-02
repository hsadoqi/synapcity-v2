import { act, render, renderHook, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMediaQuery } from './use-media-query';
import { useIsMobile } from './use-mobile';

/** A media query list the test can flip, counting its live listeners. */
let matching = new Set<string>();
let listeners: Map<string, Set<() => void>>;

function flip(query: string, on: boolean) {
  act(() => {
    if (on) matching.add(query);
    else matching.delete(query);
    for (const listener of listeners.get(query) ?? []) listener();
  });
}

const live = (query: string) => listeners.get(query)?.size ?? 0;

beforeEach(() => {
  matching = new Set();
  listeners = new Map();
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return matching.has(query);
    },
    media: query,
    addEventListener: (_: 'change', listener: () => void) => {
      if (!listeners.has(query)) listeners.set(query, new Set());
      listeners.get(query)!.add(listener);
    },
    removeEventListener: (_: 'change', listener: () => void) => {
      listeners.get(query)?.delete(listener);
    },
  }));
});

afterEach(() => vi.unstubAllGlobals());

const WIDE = '(min-width: 80rem)';

function Probe({ query }: { query: string }) {
  return <output>{String(useMediaQuery(query))}</output>;
}

describe('useMediaQuery', () => {
  it('renders false on the server without touching matchMedia', () => {
    const spy = vi.fn();
    vi.stubGlobal('matchMedia', spy);
    expect(renderToString(<Probe query={WIDE} />)).toContain('false');
    expect(spy).not.toHaveBeenCalled();
  });

  it('hydrates from the server value, then shows the real one', () => {
    matching.add(WIDE);
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Probe query={WIDE} />);
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Probe query={WIDE} />, { container, hydrate: true });
    expect(screen.getByRole('status').textContent).toBe('true');
    expect(errors).not.toHaveBeenCalled();
    container.remove();
  });

  it('reads the current value on a client render', () => {
    matching.add(WIDE);
    const { result } = renderHook(() => useMediaQuery(WIDE));
    expect(result.current).toBe(true);
  });

  it('follows the query as it changes', () => {
    const { result } = renderHook(() => useMediaQuery(WIDE));
    expect(result.current).toBe(false);
    flip(WIDE, true);
    expect(result.current).toBe(true);
    flip(WIDE, false);
    expect(result.current).toBe(false);
  });

  it('stops listening on unmount and reads afresh on remount', () => {
    const first = renderHook(() => useMediaQuery(WIDE));
    expect(live(WIDE)).toBe(1);
    first.unmount();
    expect(live(WIDE)).toBe(0);

    matching.add(WIDE);
    const second = renderHook(() => useMediaQuery(WIDE));
    expect(second.result.current).toBe(true);
    expect(live(WIDE)).toBe(1);
  });

  it('moves its listener when the query changes', () => {
    const { result, rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: WIDE } },
    );
    matching.add('(min-width: 48rem)');
    rerender({ query: '(min-width: 48rem)' });
    expect(result.current).toBe(true);
    expect(live(WIDE)).toBe(0);
    expect(live('(min-width: 48rem)')).toBe(1);
  });

  it('reports false and listens to nothing where matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result, unmount } = renderHook(() => useMediaQuery(WIDE));
    expect(result.current).toBe(false);
    unmount();
  });
});

describe('useIsMobile', () => {
  it('follows the mobile breakpoint', () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
    flip('(max-width: 767px)', true);
    expect(result.current).toBe(true);
  });
});
