import type { GridItem, ItemSize, LayoutItem } from '../../types';
import { bottomOf } from '../bottom-of';

/** Rows a collapsed item reserves; enough for a 50px header. */
export const COLLAPSED_ROWS = 2;

/**
 * Builds the render layout for one breakpoint. Items missing from the stored
 * layout are appended, widths are held between the item's minimum and the
 * column count, and collapsed
 * items shrink to {@link COLLAPSED_ROWS} without losing their stored height.
 * `size` is each item's default size at this breakpoint.
 */
export function toGridLayout(
  stored: readonly LayoutItem[],
  items: readonly { id: string; collapsed: boolean; size: ItemSize }[],
  cols: number,
): GridItem[] {
  const byId = new Map(stored.map((l) => [l.i, l]));
  let bottom = bottomOf(stored);
  return items.map(({ id, collapsed, size }) => {
    let item = byId.get(id);
    if (!item) {
      item = { i: id, x: 0, y: bottom, w: size.w, h: size.h };
      bottom += size.h;
    }
    const minW = Math.min(size.minW, cols);
    const width = Math.min(Math.max(item.w, minW, 1), cols);
    const x = Math.min(item.x, cols - width);
    return {
      i: id,
      x: Math.max(0, x),
      y: item.y,
      w: width,
      h: collapsed ? COLLAPSED_ROWS : Math.max(item.h, size.minH),
      minW,
      minH: collapsed ? COLLAPSED_ROWS : size.minH,
      maxW: cols,
      ...(collapsed ? { isResizable: false as const } : {}),
    };
  });
}

/**
 * Folds a layout reported by the grid back into storage. Positions always
 * update; a collapsed item keeps its stored (expanded) height.
 */
export function mergeLayoutChange(
  stored: readonly LayoutItem[],
  reported: readonly LayoutItem[],
  collapsedIds: ReadonlySet<string>,
): LayoutItem[] {
  const byId = new Map(stored.map((l) => [l.i, l]));
  return reported.map((r) => {
    const prev = byId.get(r.i);
    const h = collapsedIds.has(r.i) && prev ? prev.h : r.h;
    return { i: r.i, x: r.x, y: r.y, w: r.w, h };
  });
}

/** Same items in the same places, in any order. */
export function layoutsEqual(
  a: readonly LayoutItem[],
  b: readonly LayoutItem[],
): boolean {
  if (a.length !== b.length) return false;
  const byId = new Map(a.map((l) => [l.i, l]));
  return b.every((l) => {
    const o = byId.get(l.i);
    return !!o && o.x === l.x && o.y === l.y && o.w === l.w && o.h === l.h;
  });
}
