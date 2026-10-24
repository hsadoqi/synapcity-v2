import type { Breakpoint } from './breakpoint';

/** Stored grid placement, in grid units. Constraints are derived, not stored. */
export type LayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type BreakpointLayouts = Record<Breakpoint, LayoutItem[]>;

/** Default and minimum size of one item at one breakpoint, in grid units. */
export type ItemSize = { w: number; h: number; minW: number; minH: number };

export type BreakpointSizes = Record<Breakpoint, ItemSize>;

/** Grid item as a grid renderer receives it: stored placement plus derived constraints. */
export type GridItem = LayoutItem & {
  minW: number;
  minH: number;
  maxW: number;
  /** Set only to opt out; otherwise the grid-level resize setting applies. */
  isResizable?: false;
  /** Fixed in place: not dragged or resized, and other items move around it. */
  static?: true;
};
