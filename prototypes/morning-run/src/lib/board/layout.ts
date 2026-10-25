import type { z } from 'zod';

import type { layoutItemSchema } from './model';

export type LayoutItem = z.infer<typeof layoutItemSchema>;

const GRID_COLS = 12;

/** Default size of each widget, in grid cells. */
const WIDGET_SIZE: Record<string, { w: number; h: number }> = {
  Journal: { w: 6, h: 7 },
  Focus: { w: 6, h: 4 },
  Tasks: { w: 6, h: 5 },
  Schedule: { w: 6, h: 4 },
};
const DEFAULT_SIZE = { w: 4, h: 4 };

export const sizeOf = (id: string) => WIDGET_SIZE[id] ?? DEFAULT_SIZE;

/** Lay widgets out left to right, wrapping to a new row when one does not fit. */
export function flowLayout(ids: string[], startY = 0): LayoutItem[] {
  const items: LayoutItem[] = [];
  let x = 0;
  let y = startY;
  let rowH = 0;
  for (const id of ids) {
    const { w, h } = sizeOf(id);
    if (x + w > GRID_COLS) {
      x = 0;
      y += rowH;
      rowH = 0;
    }
    items.push({ i: id, x, y, w, h });
    x += w;
    rowH = Math.max(rowH, h);
  }
  return items;
}

/**
 * Keep the arrangement you saved for widgets that still exist, and flow any new ones in
 * below it. Widgets that are gone are dropped.
 */
export function mergeLayout(saved: LayoutItem[], ids: string[]): LayoutItem[] {
  const wanted = new Set(ids);
  const kept = saved.filter((item) => wanted.has(item.i));
  const have = new Set(kept.map((i) => i.i));
  const fresh = ids.filter((id) => !have.has(id));
  const bottom = kept.reduce((m, i) => Math.max(m, i.y + i.h), 0);
  return [...kept, ...flowLayout(fresh, bottom)];
}

/** One column for narrow screens: reading order of the saved arrangement, top to bottom. */
export function stackLayout(layout: LayoutItem[]): LayoutItem[] {
  return [...layout]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((item, index) => ({ ...item, x: 0, y: index * 100, w: 1 }));
}

export type MoveKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

/**
 * The keyboard way to rearrange: arrows move a widget one cell, Shift and arrows resize it.
 * Dragging is a pointer feature; this keeps the board usable without one.
 */
export function nudge(
  layout: LayoutItem[],
  id: string,
  key: MoveKey,
  resize: boolean,
): LayoutItem[] {
  const dx = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
  const dy = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0;
  return layout.map((item) => {
    if (item.i !== id) return item;
    if (resize) {
      const w = Math.min(GRID_COLS - item.x, Math.max(2, item.w + dx));
      const h = Math.max(2, item.h + dy);
      return { ...item, w, h };
    }
    const x = Math.min(GRID_COLS - item.w, Math.max(0, item.x + dx));
    const y = Math.max(0, item.y + dy);
    return { ...item, x, y };
  });
}
