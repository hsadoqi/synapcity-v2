import { appendLayoutEntry, removeLayoutEntry } from '@synapcity/domain-grids';
import { createId } from '@synapcity/domain-prototypes';

import type {
  DashboardComposition,
  Widget,
  WidgetPatch,
  WidgetStatus,
} from '../../types';
import { WIDGET_SIZES } from '../widget-sizes';

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
  if (
    next.title === widget.title &&
    next.collapsed === widget.collapsed &&
    next.highlight === widget.highlight
  ) {
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
