import { moveElement, verticalCompactor } from 'react-grid-layout/core';

import type { GridItem, LayoutItem } from '@synapcity/domain-grids';

/** A change in grid units. Move changes x/y; resize changes w/h. */
export type LayoutDelta = { dx: number; dy: number; dw: number; dh: number };

const ARROWS: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/**
 * The move or resize an arrow key asks for. Shift turns arrows into resizing;
 * other keys return null.
 */
export function keyboardDelta(key: string, shift: boolean): LayoutDelta | null {
  const arrow = ARROWS[key];
  if (!arrow) return null;
  const [ax, ay] = arrow;
  return shift
    ? { dx: 0, dy: 0, dw: ax, dh: ay }
    : { dx: ax, dy: ay, dw: 0, dh: 0 };
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

/**
 * Applies a delta to one item, keeping it inside the grid and within its
 * minimum and maximum size. Other items are returned unchanged.
 */
export function nudgeLayoutItem(
  items: readonly GridItem[],
  id: string,
  delta: LayoutDelta,
  cols: number,
): LayoutItem[] {
  const layout = items.map((item) => ({ ...item }));
  const item = layout.find((candidate) => candidate.i === id);
  if (!item) return layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));

  const w = clamp(item.w + delta.dw, item.minW, Math.min(item.maxW, cols));
  const h = Math.max(item.minH, item.h + delta.dh);
  const x = clamp(item.x + delta.dx, 0, Math.max(0, cols - w));
  const y = Math.max(0, item.y + delta.dy);
  if (x === item.x && y === item.y && w === item.w && h === item.h) {
    return layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
  }

  item.w = w;
  item.h = h;
  const moved = moveElement(layout, item, x, y, true, false, 'vertical', cols);
  return verticalCompactor
    .compact(moved, cols)
    .map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
}
