import {
  appendLayoutEntry,
  BREAKPOINTS,
  columnsFor,
  emptyLayouts,
  layoutsForItems,
  mergeLayoutChange,
  packLayout,
  removeLayoutEntry,
  toGridLayout,
  type Breakpoint,
  type BreakpointLayouts,
  type GridItem,
  type LayoutItem,
} from '@synapcity/domain-grids';
import { z } from 'zod';

import { objectFor, type UnknownKeys, type WidgetStatus } from './widget-base';
import {
  WIDGET_SIZES,
  createWidgetId,
  widgetSchema,
  type LinkSourceKind,
  type Widget,
  type WidgetPatch,
} from './widgets';

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

const placement = z.number().int().nonnegative();
const span = z.number().int().positive();

/**
 * The composition contract with the given handling of unknown keys. The
 * breakpoint layouts are strict in both variants, as they always were.
 */
export function compositionSchema(keys: UnknownKeys) {
  const object = objectFor(keys);
  const layoutItemSchema = object({
    i: z.string().min(1),
    x: placement,
    y: placement,
    w: span,
    h: span,
  });
  return object({
    settings: object({
      columns: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
      ]),
      cardRadius: z.union([
        z.literal(4),
        z.literal(8),
        z.literal(12),
        z.literal(16),
      ]),
      showWidgetTitles: z.boolean(),
    }),
    widgets: z.array(widgetSchema(keys)),
    layouts: z.strictObject({
      lg: z.array(layoutItemSchema),
      md: z.array(layoutItemSchema),
      sm: z.array(layoutItemSchema),
    }),
  }).superRefine((composition, ctx) => {
    const widgetIds = new Set<string>();
    for (const [index, widget] of composition.widgets.entries()) {
      if (widgetIds.has(widget.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['widgets', index, 'id'],
          message: 'Widget IDs must be unique.',
        });
      }
      widgetIds.add(widget.id);
    }

    for (const breakpoint of BREAKPOINTS) {
      const layoutIds = new Set<string>();
      for (const [index, item] of composition.layouts[breakpoint].entries()) {
        if (!widgetIds.has(item.i)) {
          ctx.addIssue({
            code: 'custom',
            path: ['layouts', breakpoint, index, 'i'],
            message: 'Layout items must reference a widget in the composition.',
          });
        }
        if (layoutIds.has(item.i)) {
          ctx.addIssue({
            code: 'custom',
            path: ['layouts', breakpoint, index, 'i'],
            message: 'A widget may appear only once in a breakpoint layout.',
          });
        }
        layoutIds.add(item.i);
      }
    }
  });
}

/**
 * A saved dashboard composition: its settings, its widgets and a layout for
 * each breakpoint. Use it to validate a composition read back from storage;
 * keys it does not define are dropped. The write boundary uses
 * `parsePersistableComposition`, which refuses them.
 */
export const dashboardCompositionSchema = compositionSchema(
  'strip',
) satisfies z.ZodType<DashboardComposition>;

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
  const idMap = new Map(c.widgets.map((w) => [w.id, createWidgetId()]));
  const remap = (items: LayoutItem[]) =>
    items.flatMap((l) => {
      const i = idMap.get(l.i);
      return i ? [{ ...l, i }] : [];
    });
  return {
    settings: { ...c.settings },
    widgets: c.widgets.map((w) => ({
      ...w,
      id: idMap.get(w.id) ?? createWidgetId(),
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
    id: createWidgetId(),
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
