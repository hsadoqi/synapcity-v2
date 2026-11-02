import type { UIEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  getVirtualRange,
  scrollTopForIndex,
  useVirtualList,
} from './use-virtual-list';

const base = {
  count: 1000,
  scrollTop: 0,
  viewportHeight: 280,
  rowHeight: 28,
  overscan: 2,
  initialRows: 20,
};

describe('getVirtualRange', () => {
  it('renders the rows in view plus overscan after them at the top', () => {
    expect(getVirtualRange(base)).toEqual({ start: 0, end: 12 });
  });

  it('adds overscan on both sides once scrolled', () => {
    expect(getVirtualRange({ ...base, scrollTop: 28 * 100 })).toEqual({
      start: 98,
      end: 112,
    });
  });

  it('never runs past the end of the list', () => {
    expect(getVirtualRange({ ...base, scrollTop: 28 * 995 })).toEqual({
      start: 993,
      end: 1000,
    });
  });

  it('shows the first rows before the viewport is measured', () => {
    expect(getVirtualRange({ ...base, viewportHeight: 0 })).toEqual({
      start: 0,
      end: 20,
    });
  });

  it('returns an empty range for an empty list and clamps a short one', () => {
    expect(getVirtualRange({ ...base, count: 0 })).toEqual({
      start: 0,
      end: 0,
    });
    expect(getVirtualRange({ ...base, count: 3 })).toEqual({
      start: 0,
      end: 3,
    });
  });

  it('treats a negative scroll (overscroll bounce) as the top', () => {
    expect(getVirtualRange({ ...base, scrollTop: -40 })).toEqual({
      start: 0,
      end: 12,
    });
  });
});

describe('scrollTopForIndex', () => {
  const view = { scrollTop: 280, viewportHeight: 280, rowHeight: 28 };

  it('leaves a row that is already in view alone', () => {
    expect(scrollTopForIndex(12, view)).toBeUndefined();
  });

  it('scrolls up to a row above the view', () => {
    expect(scrollTopForIndex(2, view)).toBe(56);
  });

  it('scrolls down just far enough for a row below the view', () => {
    expect(scrollTopForIndex(25, view)).toBe(26 * 28 - 280);
  });
});

describe('useVirtualList', () => {
  it('renders every row with no spacers when off', () => {
    const { result } = renderHook(() =>
      useVirtualList({ count: 500, enabled: false }),
    );
    expect(result.current.range).toEqual({ start: 0, end: 500 });
    expect(result.current.paddingTop).toBe(0);
    expect(result.current.paddingBottom).toBe(0);
  });

  it('windows the list and sizes the spacers for the rows it leaves out', () => {
    const { result } = renderHook(() =>
      useVirtualList({ count: 500, initialRows: 10, estimateRowHeight: 30 }),
    );
    expect(result.current.range).toEqual({ start: 0, end: 10 });
    expect(result.current.paddingBottom).toBe(490 * 30);
  });

  it('follows the scroll position of its viewport', () => {
    const { result } = renderHook(() =>
      useVirtualList({ count: 500, overscan: 0, estimateRowHeight: 20 }),
    );
    const node = document.createElement('div');
    Object.defineProperty(node, 'clientHeight', { value: 100 });
    act(() => result.current.viewportRef(node));
    act(() =>
      result.current.onScroll({
        currentTarget: { scrollTop: 400 },
      } as unknown as UIEvent<HTMLElement>),
    );
    expect(result.current.range).toEqual({ start: 20, end: 25 });
    expect(result.current.paddingTop).toBe(400);
  });

  it('replaces the estimate with a measured row height', () => {
    const { result } = renderHook(() =>
      useVirtualList({ count: 100, initialRows: 5, estimateRowHeight: 28 }),
    );
    const row = document.createElement('div');
    Object.defineProperty(row, 'offsetHeight', { value: 44 });
    act(() => result.current.measureRow(row));
    expect(result.current.paddingBottom).toBe(95 * 44);
  });

  it('scrolls the viewport to bring a row into view', () => {
    const { result } = renderHook(() =>
      useVirtualList({ count: 100, estimateRowHeight: 20 }),
    );
    const node = document.createElement('div');
    Object.defineProperty(node, 'clientHeight', { value: 100 });
    act(() => result.current.viewportRef(node));
    act(() => result.current.scrollToIndex(30));
    expect(node.scrollTop).toBe(31 * 20 - 100);
  });
});
