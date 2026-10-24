import type { BreakpointLayouts, BreakpointSizes } from '../../types';
import { bottomOf } from '../bottom-of';
import { BREAKPOINTS, columnsFor } from '../breakpoints';
import { packLayout } from '../pack-layout';

export function emptyLayouts(): BreakpointLayouts {
  return { lg: [], md: [], sm: [] };
}

/** Packs `items` at every breakpoint, using each item's default size there. */
export function layoutsForItems(
  items: readonly { id: string; sizes: BreakpointSizes }[],
  columns: number,
): BreakpointLayouts {
  const layouts = emptyLayouts();
  for (const bp of BREAKPOINTS) {
    const entries = items.map((item) => ({ id: item.id, ...item.sizes[bp] }));
    layouts[bp] = packLayout(entries, columnsFor(columns, bp));
  }
  return layouts;
}

/** Places an item at the bottom-left of every breakpoint; compaction pulls it up. */
export function appendLayoutEntry(
  layouts: BreakpointLayouts,
  id: string,
  sizes: BreakpointSizes,
): BreakpointLayouts {
  const next = { ...layouts };
  for (const bp of BREAKPOINTS) {
    const current = layouts[bp].filter((l) => l.i !== id);
    const { w, h } = sizes[bp];
    next[bp] = [...current, { i: id, x: 0, y: bottomOf(current), w, h }];
  }
  return next;
}

export function removeLayoutEntry(
  layouts: BreakpointLayouts,
  id: string,
): BreakpointLayouts {
  const next = { ...layouts };
  for (const bp of BREAKPOINTS)
    next[bp] = layouts[bp].filter((l) => l.i !== id);
  return next;
}
