import type { EntityRef } from '@synapcity/domain-prototypes';

export type WidgetStatus = 'active' | 'hidden' | 'archived';

export type WidgetHighlight = 'accent' | 'neutral' | 'none';

type WidgetBase = {
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

/*
 * The prototype's input model: a record-backed widget points at one record
 * through `source`; a query widget (calendar, feed) describes what to select.
 * PRODUCT.md leaves the widget source model open; this is the prototype's
 * answer, not an adopted one.
 */
export type StatWidget = WidgetBase & {
  type: 'stat';
  source: EntityRef<'metric'>;
};
export type ProgressWidget = WidgetBase & {
  type: 'progress';
  source: EntityRef<'goal'>;
};
export type HabitWidget = WidgetBase & {
  type: 'habit';
  source: EntityRef<'habit'>;
};
export type NotesWidget = WidgetBase & {
  type: 'notes';
  source: EntityRef<'note'>;
};
export type TasksWidget = WidgetBase & {
  type: 'tasks';
  source: EntityRef<'project'>;
};
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

export type Widget =
  | StatWidget
  | ProgressWidget
  | HabitWidget
  | NotesWidget
  | TasksWidget
  | CalendarWidget
  | AgendaWidget
  | FeedWidget
  | PinnedWidget
  | LastOpenedWidget
  | SpacesWidget;

export type WidgetType = Widget['type'];

/** The presentation fields a widget edit may change. */
export type WidgetPatch = Partial<
  Pick<
    WidgetBase,
    'title' | 'collapsed' | 'highlight' | 'locked' | 'pinned' | 'resizable'
  >
>;
