'use client';

import * as React from 'react';

export interface VirtualRangeInput {
  readonly count: number;
  readonly scrollTop: number;
  readonly viewportHeight: number;
  readonly rowHeight: number;
  readonly overscan: number;
  /** Rows shown before the viewport has been measured (or when it measures 0). */
  readonly initialRows: number;
}

/** The rows to render, `start` inclusive and `end` exclusive. */
export interface VirtualRange {
  readonly start: number;
  readonly end: number;
}

/**
 * Which rows of a list of equal-height rows are in view, plus `overscan` rows
 * either side so a fast scroll does not show a gap. Pure, so it is tested
 * without a layout engine.
 */
export function getVirtualRange({
  count,
  scrollTop,
  viewportHeight,
  rowHeight,
  overscan,
  initialRows,
}: VirtualRangeInput): VirtualRange {
  if (count <= 0) return { start: 0, end: 0 };
  if (viewportHeight <= 0 || rowHeight <= 0) {
    return { start: 0, end: Math.min(count, initialRows) };
  }
  const first = Math.floor(Math.max(0, scrollTop) / rowHeight);
  const visible = Math.ceil(viewportHeight / rowHeight);
  const start = Math.min(Math.max(0, first - overscan), count - 1);
  const end = Math.min(count, first + visible + overscan);
  return { start, end: Math.max(end, start + 1) };
}

/** The scroll position that brings a row fully into view, or `undefined` if it already is. */
export function scrollTopForIndex(
  index: number,
  {
    scrollTop,
    viewportHeight,
    rowHeight,
  }: {
    readonly scrollTop: number;
    readonly viewportHeight: number;
    readonly rowHeight: number;
  },
): number | undefined {
  const top = index * rowHeight;
  const bottom = top + rowHeight;
  if (top < scrollTop) return top;
  if (bottom > scrollTop + viewportHeight) return bottom - viewportHeight;
  return undefined;
}

export interface UseVirtualListOptions {
  readonly count: number;
  /** Off renders every row, so a caller can switch windowing on by a threshold. */
  readonly enabled?: boolean;
  /** Used until a rendered row has been measured. */
  readonly estimateRowHeight?: number;
  readonly overscan?: number;
  readonly initialRows?: number;
}

export interface UseVirtualListResult {
  readonly range: VirtualRange;
  /** Space before and after the rendered rows, so the scrollbar matches the full list. */
  readonly paddingTop: number;
  readonly paddingBottom: number;
  /** Attach to the scrolling element. */
  readonly viewportRef: (element: HTMLElement | null) => void;
  readonly onScroll: (event: React.UIEvent<HTMLElement>) => void;
  /** Attach to one rendered row; its height replaces the estimate. */
  readonly measureRow: (element: HTMLElement | null) => void;
  readonly scrollToIndex: (index: number) => void;
}

/**
 * Windowing for a long list of equal-height rows, with no dependency: only the
 * rows in view are rendered, between two spacers. When off, every row renders
 * and the spacers are 0.
 */
export function useVirtualList({
  count,
  enabled = true,
  estimateRowHeight = 28,
  overscan = 6,
  initialRows = 20,
}: UseVirtualListOptions): UseVirtualListResult {
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(0);
  const [rowHeight, setRowHeight] = React.useState(estimateRowHeight);
  const element = React.useRef<HTMLElement | null>(null);
  const observer = React.useRef<ResizeObserver | null>(null);

  const viewportRef = React.useCallback((node: HTMLElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    element.current = node;
    if (node === null) return;
    setViewportHeight(node.clientHeight);
    if (typeof ResizeObserver !== 'undefined') {
      observer.current = new ResizeObserver(() =>
        setViewportHeight(node.clientHeight),
      );
      observer.current.observe(node);
    }
  }, []);

  const measureRow = React.useCallback((node: HTMLElement | null) => {
    const height = node?.offsetHeight ?? 0;
    if (height > 0)
      setRowHeight((current) => (current === height ? current : height));
  }, []);

  const onScroll = React.useCallback((event: React.UIEvent<HTMLElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = React.useCallback(
    (index: number) => {
      const node = element.current;
      if (node === null) return;
      const next = scrollTopForIndex(index, {
        scrollTop: node.scrollTop,
        viewportHeight: node.clientHeight,
        rowHeight,
      });
      if (next === undefined) return;
      node.scrollTop = next;
      setScrollTop(next);
    },
    [rowHeight],
  );

  const range = enabled
    ? getVirtualRange({
        count,
        scrollTop,
        viewportHeight,
        rowHeight,
        overscan,
        initialRows,
      })
    : { start: 0, end: count };

  return {
    range,
    paddingTop: enabled ? range.start * rowHeight : 0,
    paddingBottom: enabled ? Math.max(0, count - range.end) * rowHeight : 0,
    viewportRef,
    onScroll,
    measureRow,
    scrollToIndex,
  };
}
