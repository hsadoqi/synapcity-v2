/** Grid metrics in px, from the responsive-grid prototype (Dashboard.dc.html). */
export const GRID = {
  rowHeight: 32,
  margin: 16,
  minColumnWidth: 120,
} as const;

/** Narrowest grid width at which every column keeps its minimum width. */
export function minGridWidth(cols: number): number {
  return cols * GRID.minColumnWidth + (cols - 1) * GRID.margin;
}
