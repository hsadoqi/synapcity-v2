import type { Breakpoint } from '@synapcity/domain-grids';

/** Preview widths in px for the tablet and mobile layouts; desktop fills the canvas. */
export const DEVICE_FRAME_WIDTH: Record<Breakpoint, number | null> = {
  lg: null,
  md: 834,
  sm: 390,
};
