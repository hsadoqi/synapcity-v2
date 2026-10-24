import type { Breakpoint } from '../../types';

export const BREAKPOINTS: readonly Breakpoint[] = ['lg', 'md', 'sm'];

/** Breakpoint a viewport of this width opens in. */
export function resolveBreakpoint(viewportWidth: number): Breakpoint {
  if (viewportWidth < 640) return 'sm';
  if (viewportWidth < 1024) return 'md';
  return 'lg';
}

/** Columns at a breakpoint: desktop uses `columns`, tablet one fewer, mobile one. */
export function columnsFor(columns: number, bp: Breakpoint): number {
  if (bp === 'lg') return columns;
  if (bp === 'md') return Math.max(1, columns - 1);
  return 1;
}
