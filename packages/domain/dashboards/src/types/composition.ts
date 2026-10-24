import type { BreakpointLayouts } from '@synapcity/domain-grids';

import type { Widget } from './widget';

export type DashboardSettings = {
  /** Desktop column count; tablet uses one fewer, mobile always one. */
  columns: 1 | 2 | 3 | 4;
  /** Widget corner radius in px. */
  cardRadius: 4 | 8 | 12 | 16;
  showWidgetTitles: boolean;
};

/**
 * What a dashboard arranges: its widgets, where they sit at each breakpoint,
 * and its display settings. The dashboard record itself (name, owner,
 * timestamps) is the ADR-0013 record and is not part of this shape; how
 * widgets and layouts are stored is still undecided.
 */
export type DashboardComposition = {
  settings: DashboardSettings;
  widgets: Widget[];
  layouts: BreakpointLayouts;
};
