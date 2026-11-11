import { z } from 'zod';

/**
 * How a schema treats keys it does not define: `strip` drops them (reads stay
 * tolerant), `strict` refuses them (the persistence write boundary). Every
 * object in the composition contract is built through {@link objectFor}, so
 * the two variants come from one definition and differ only in this.
 */
export type UnknownKeys = 'strip' | 'strict';

/**
 * `z.object` or `z.strictObject`. Both build the same output type; only the
 * handling of unknown keys differs, which is why the strict builder may stand
 * in for `z.object`'s signature.
 */
export function objectFor(keys: UnknownKeys): typeof z.object {
  return keys === 'strict' ? (z.strictObject as typeof z.object) : z.object;
}

export type WidgetStatus = 'active' | 'hidden' | 'archived';

export type WidgetHighlight = 'accent' | 'neutral' | 'none';

export type WidgetBase = {
  id: string;
  /** View label; independent of the source record's own name. */
  title: string;
  collapsed: boolean;
  highlight: WidgetHighlight;
  status: WidgetStatus;
  /**
   * Fixed in place on the dashboard: not dragged or resized, and other
   * widgets move around it. Layout only. @default false
   */
  locked?: boolean;
  /**
   * Surfaced outside the dashboard (its space's page, the command palette).
   * No effect on layout; separate from `locked`. Nothing reads it yet.
   * @default false
   */
  pinned?: boolean;
  /** `false` keeps the widget's size; it can still move. @default true */
  resizable?: boolean;
};

/** The fields every widget has, as schemas. */
export const widgetBaseShape = {
  id: z.string().min(1),
  title: z.string(),
  collapsed: z.boolean(),
  highlight: z.enum(['accent', 'neutral', 'none']),
  status: z.enum(['active', 'hidden', 'archived']),
  // Optional: compositions saved before these existed must still parse.
  locked: z.boolean().optional(),
  pinned: z.boolean().optional(),
  resizable: z.boolean().optional(),
};

/*
 * Query widgets select records and own no data: they never point at one.
 */
export type CalendarWidget = WidgetBase & {
  type: 'calendar';
  query: { range: 'week' };
};
/** One day's events; the day shown is screen state, not saved. */
export type AgendaWidget = WidgetBase & {
  type: 'agenda';
  query: { range: 'day' };
};
export type FeedWidget = WidgetBase & {
  type: 'feed';
  query: { limit: number };
};

/*
 * Link widgets (Slice 4): query-shaped views of the owner's own Spaces,
 * documents and dashboards. Like the other query widgets they select, never
 * point at one record, and own no data.
 */
/** Pinned records, newest pin first. */
export type PinnedWidget = WidgetBase & {
  type: 'pinned';
  query: { limit: number };
};
/** Records by when they were last opened, most recent first. */
export type LastOpenedWidget = WidgetBase & {
  type: 'last-opened';
  query: { limit: number };
};
/** The owner's Spaces. */
export type SpacesWidget = WidgetBase & {
  type: 'spaces';
  query: { limit: number };
};

/** The schemas of the widgets that own no data, in the composition's order. */
export function dataFreeWidgetSchemas(keys: UnknownKeys) {
  const object = objectFor(keys);
  const limitQuery = () => object({ limit: z.number().int().min(1).max(50) });
  return [
    object({
      ...widgetBaseShape,
      type: z.literal('calendar'),
      query: object({ range: z.literal('week') }),
    }),
    object({
      ...widgetBaseShape,
      type: z.literal('agenda'),
      query: object({ range: z.literal('day') }),
    }),
    object({
      ...widgetBaseShape,
      type: z.literal('feed'),
      query: limitQuery(),
    }),
    object({
      ...widgetBaseShape,
      type: z.literal('pinned'),
      query: limitQuery(),
    }),
    object({
      ...widgetBaseShape,
      type: z.literal('last-opened'),
      query: limitQuery(),
    }),
    object({
      ...widgetBaseShape,
      type: z.literal('spaces'),
      query: limitQuery(),
    }),
  ] as const;
}
