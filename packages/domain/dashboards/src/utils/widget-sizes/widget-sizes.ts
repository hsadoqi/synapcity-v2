import type { BreakpointSizes } from '@synapcity/domain-grids';

import type { WidgetType } from '../../types';

/** Default and minimum size of each widget type per breakpoint, from the prototype. */
export const WIDGET_SIZES: Record<WidgetType, BreakpointSizes> = {
  stat: {
    lg: { w: 1, h: 3, minW: 1, minH: 2 },
    md: { w: 1, h: 3, minW: 1, minH: 2 },
    sm: { w: 1, h: 3, minW: 1, minH: 2 },
  },
  progress: {
    lg: { w: 1, h: 3, minW: 1, minH: 2 },
    md: { w: 1, h: 3, minW: 1, minH: 2 },
    sm: { w: 1, h: 4, minW: 1, minH: 3 },
  },
  // One row taller than the prototype's 3 so the day labels are not clipped.
  habit: {
    lg: { w: 1, h: 4, minW: 1, minH: 3 },
    md: { w: 1, h: 4, minW: 1, minH: 3 },
    sm: { w: 1, h: 4, minW: 1, minH: 3 },
  },
  calendar: {
    lg: { w: 1, h: 5, minW: 1, minH: 3 },
    md: { w: 1, h: 5, minW: 1, minH: 3 },
    sm: { w: 1, h: 6, minW: 1, minH: 4 },
  },
  notes: {
    lg: { w: 1, h: 4, minW: 1, minH: 2 },
    md: { w: 1, h: 4, minW: 1, minH: 2 },
    sm: { w: 1, h: 4, minW: 1, minH: 3 },
  },
  feed: {
    lg: { w: 1, h: 5, minW: 1, minH: 3 },
    md: { w: 1, h: 5, minW: 1, minH: 3 },
    sm: { w: 1, h: 6, minW: 1, minH: 4 },
  },
  tasks: {
    lg: { w: 1, h: 5, minW: 1, minH: 3 },
    md: { w: 1, h: 5, minW: 1, minH: 3 },
    sm: { w: 1, h: 6, minW: 1, minH: 4 },
  },
};
