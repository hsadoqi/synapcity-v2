import type { LayoutItem } from '../../types';

/** Left-to-right row packing, used for a grid's initial layout. */
export function packLayout(
  entries: readonly { id: string; w: number; h: number }[],
  cols: number,
): LayoutItem[] {
  let x = 0;
  let y = 0;
  let rowH = 0;
  const out: LayoutItem[] = [];
  for (const e of entries) {
    const w = Math.min(e.w, cols);
    if (x + w > cols) {
      x = 0;
      y += rowH;
      rowH = 0;
    }
    out.push({ i: e.id, x, y, w, h: e.h });
    x += w;
    rowH = Math.max(rowH, e.h);
  }
  return out;
}
