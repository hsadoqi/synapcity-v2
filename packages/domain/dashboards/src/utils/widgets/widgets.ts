import {
  appendLayoutEntry,
  columnsFor,
  packLayout,
  removeLayoutEntry,
  type Breakpoint,
} from '@synapcity/domain-grids';
import { createId } from '@synapcity/domain-prototypes';

import type {
  DashboardComposition,
  Widget,
  WidgetPatch,
  WidgetStatus,
  WidgetType,
} from '../../types';
import { WIDGET_SIZES } from '../widget-sizes';

/**
 * The widget types a dashboard saved on the server may hold (Slice 4): the
 * link widgets, which own no data. The other types stay in the model for
 * stories and for widgets that own data later.
 */
export const LINK_WIDGET_TYPES: readonly WidgetType[] = [
  'pinned',
  'last-opened',
  'spaces',
];

/** The kinds of record the link widgets list; one host fetch per kind. */
export type LinkSourceKind = 'spaces' | 'documents' | 'dashboards';

/**
 * The record kinds a composition's link widgets list, so the host fetches only
 * those. Pinned and Last opened list records of every kind; Spaces lists
 * Spaces only. Every widget counts whatever its status: a hidden or archived
 * widget can be restored without a reload, and must not find its data missing.
 */
export function neededLinkKinds(c: DashboardComposition): Set<LinkSourceKind> {
  const kinds = new Set<LinkSourceKind>();
  for (const widget of c.widgets) {
    if (widget.type === 'spaces') kinds.add('spaces');
    else if (widget.type === 'pinned' || widget.type === 'last-opened') {
      kinds.add('spaces').add('documents').add('dashboards');
    }
  }
  return kinds;
}

export function activeWidgets(c: DashboardComposition): Widget[] {
  return c.widgets.filter((w) => w.status === 'active');
}

export function widgetsWithStatus(
  c: DashboardComposition,
  status: WidgetStatus,
): Widget[] {
  return c.widgets.filter((w) => w.status === status);
}

/**
 * Adds `widget`; only an active widget gets a layout entry. A widget whose id
 * is already on the dashboard is ignored.
 */
export function addWidget(
  c: DashboardComposition,
  widget: Widget,
): DashboardComposition {
  if (c.widgets.some((w) => w.id === widget.id)) return c;
  return {
    ...c,
    widgets: [...c.widgets, widget],
    layouts:
      widget.status === 'active'
        ? appendLayoutEntry(c.layouts, widget.id, WIDGET_SIZES[widget.type])
        : c.layouts,
  };
}

/** Removes the widget (the view) only; its source record is untouched. */
export function removeWidget(
  c: DashboardComposition,
  widgetId: string,
): DashboardComposition {
  if (!c.widgets.some((w) => w.id === widgetId)) return c;
  return {
    ...c,
    widgets: c.widgets.filter((w) => w.id !== widgetId),
    layouts: removeLayoutEntry(c.layouts, widgetId),
  };
}

/** Adds a second view of the same source, titled "<title> copy". */
export function duplicateWidget(
  c: DashboardComposition,
  widgetId: string,
): DashboardComposition {
  const original = c.widgets.find((w) => w.id === widgetId);
  if (!original) return c;
  return addWidget(c, {
    ...original,
    id: createId('wgt'),
    title: `${original.title} copy`,
    status: 'active',
  });
}

export function updateWidget(
  c: DashboardComposition,
  widgetId: string,
  patch: WidgetPatch,
): DashboardComposition {
  const widget = c.widgets.find((w) => w.id === widgetId);
  if (!widget) return c;
  const next = { ...widget, ...patch };
  // A patch that changes nothing keeps the composition. Compare every field
  // the patch sets, so a field added to WidgetPatch is never silently dropped.
  const keys = Object.keys(patch) as (keyof WidgetPatch)[];
  if (keys.every((key) => next[key] === widget[key])) {
    return c;
  }
  return {
    ...c,
    widgets: c.widgets.map((w) => (w.id === widgetId ? next : w)),
  };
}

/**
 * Hidden and archived widgets leave the grid; restoring one appends it to
 * the bottom of every breakpoint.
 */
export function setWidgetStatus(
  c: DashboardComposition,
  widgetId: string,
  status: WidgetStatus,
): DashboardComposition {
  const widget = c.widgets.find((w) => w.id === widgetId);
  if (!widget || widget.status === status) return c;
  return {
    ...c,
    widgets: c.widgets.map((w) => (w.id === widgetId ? { ...w, status } : w)),
    layouts:
      status === 'active'
        ? appendLayoutEntry(c.layouts, widget.id, WIDGET_SIZES[widget.type])
        : removeLayoutEntry(c.layouts, widgetId),
  };
}

/**
 * Moves a widget one place earlier or later in reading order (rows top to
 * bottom, left to right) at one breakpoint, and packs that breakpoint's
 * layout again with every widget's own size. For people who move widgets
 * without pointing or spatial arrow keys. A locked or missing widget, or one
 * already first or last, leaves the composition unchanged.
 */
export function moveWidgetInOrder(
  c: DashboardComposition,
  bp: Breakpoint,
  widgetId: string,
  direction: -1 | 1,
): DashboardComposition {
  const widget = c.widgets.find((w) => w.id === widgetId);
  if (!widget || widget.locked) return c;
  const ordered = [...c.layouts[bp]].sort((a, b) => a.y - b.y || a.x - b.x);
  const from = ordered.findIndex((item) => item.i === widgetId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ordered.length) return c;
  const moved = ordered[from];
  const other = ordered[to];
  if (!moved || !other) return c;
  ordered[from] = other;
  ordered[to] = moved;
  const packed = packLayout(
    ordered.map((item) => ({ id: item.i, w: item.w, h: item.h })),
    columnsFor(c.settings.columns, bp),
  );
  return { ...c, layouts: { ...c.layouts, [bp]: packed } };
}
