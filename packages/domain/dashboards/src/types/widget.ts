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
export type FeedWidget = WidgetBase & {
  type: 'feed';
  query: { limit: number };
};

export type Widget =
  | StatWidget
  | ProgressWidget
  | HabitWidget
  | NotesWidget
  | TasksWidget
  | CalendarWidget
  | FeedWidget;

export type WidgetType = Widget['type'];

/** The presentation fields a widget edit may change. */
export type WidgetPatch = Partial<
  Pick<WidgetBase, 'title' | 'collapsed' | 'highlight'>
>;
