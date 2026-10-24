import {
  columnsFor,
  emptyLayouts,
  layoutsForItems,
  mergeLayoutChange,
  toGridLayout,
  type Breakpoint,
  type BreakpointLayouts,
  type GridItem,
  type LayoutItem,
} from '@synapcity/domain-grids';
import { createId } from '@synapcity/domain-prototypes';

import type {
  DashboardComposition,
  DashboardSettings,
  Widget,
} from '../../types';
import { WIDGET_SIZES } from '../widget-sizes';
import { activeWidgets } from '../widgets';

export const DEFAULT_SETTINGS: DashboardSettings = {
  columns: 3,
  cardRadius: 8,
  showWidgetTitles: true,
};

export function createComposition(): DashboardComposition {
  return {
    settings: { ...DEFAULT_SETTINGS },
    widgets: [],
    layouts: emptyLayouts(),
  };
}

/** Packed initial layouts for `widgets` at every breakpoint. */
export function layoutsForWidgets(
  widgets: readonly Pick<Widget, 'id' | 'type'>[],
  settings: DashboardSettings,
): BreakpointLayouts {
  return layoutsForItems(
    widgets.map((w) => ({ id: w.id, sizes: WIDGET_SIZES[w.type] })),
    settings.columns,
  );
}

/**
 * Copies the widgets and layouts under fresh widget ids. The copies keep
 * pointing at the same records: a duplicate is another view, not a fork of
 * the data.
 */
export function duplicateComposition(
  c: DashboardComposition,
): DashboardComposition {
  const idMap = new Map(c.widgets.map((w) => [w.id, createId('wgt')]));
  const remap = (items: LayoutItem[]) =>
    items.flatMap((l) => {
      const i = idMap.get(l.i);
      return i ? [{ ...l, i }] : [];
    });
  return {
    settings: { ...c.settings },
    widgets: c.widgets.map((w) => ({
      ...w,
      id: idMap.get(w.id) ?? createId('wgt'),
    })),
    layouts: {
      lg: remap(c.layouts.lg),
      md: remap(c.layouts.md),
      sm: remap(c.layouts.sm),
    },
  };
}

export function updateSettings(
  c: DashboardComposition,
  patch: Partial<DashboardSettings>,
): DashboardComposition {
  return { ...c, settings: { ...c.settings, ...patch } };
}

/** Stores the layout the grid reported for one breakpoint. */
export function applyLayoutChange(
  c: DashboardComposition,
  bp: Breakpoint,
  reported: readonly LayoutItem[],
): DashboardComposition {
  const collapsed = new Set(
    c.widgets.filter((w) => w.collapsed).map((w) => w.id),
  );
  return {
    ...c,
    layouts: {
      ...c.layouts,
      [bp]: mergeLayoutChange(c.layouts[bp], reported, collapsed),
    },
  };
}

/** The render layout of the active widgets at one breakpoint. */
export function gridLayoutFor(
  c: DashboardComposition,
  bp: Breakpoint,
): GridItem[] {
  return toGridLayout(
    c.layouts[bp],
    activeWidgets(c).map((w) => ({
      id: w.id,
      collapsed: w.collapsed,
      size: WIDGET_SIZES[w.type][bp],
      fixed: w.locked,
      resizable: w.resizable,
    })),
    columnsFor(c.settings.columns, bp),
  );
}
