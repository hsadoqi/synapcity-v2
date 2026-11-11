import { type BreakpointSizes } from '@synapcity/domain-grids';
import { z } from 'zod';

import {
  recordBackedWidgetSchemas,
  type HabitWidget,
  type NotesWidget,
  type ProgressWidget,
  type StatWidget,
  type TasksWidget,
} from './prototype-widgets';
import {
  dataFreeWidgetSchemas,
  type AgendaWidget,
  type CalendarWidget,
  type FeedWidget,
  type LastOpenedWidget,
  type PinnedWidget,
  type SpacesWidget,
  type UnknownKeys,
  type WidgetBase,
} from './widget-base';

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

/** Any widget, validated by its `type`. */
export function widgetSchema(keys: UnknownKeys) {
  return z.discriminatedUnion('type', [
    ...recordBackedWidgetSchemas(keys),
    ...dataFreeWidgetSchemas(keys),
  ]);
}

/**
 * A new widget id: a readable `wgt` prefix and 48 random bits. Dashboards owns
 * its own copy rather than borrowing the prototype record ids, so stable
 * composition code does not depend on the provisional prototypes package.
 */
export function createWidgetId(): string {
  // getRandomValues works in insecure contexts, where randomUUID does not.
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return `wgt_${hex}`;
}

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

/** Link widgets list a few rows; the same size at every breakpoint. */
const LINK_SIZES: BreakpointSizes = {
  lg: { w: 1, h: 4, minW: 1, minH: 3 },
  md: { w: 1, h: 4, minW: 1, minH: 3 },
  sm: { w: 1, h: 5, minW: 1, minH: 3 },
};

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
  agenda: {
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
  pinned: LINK_SIZES,
  'last-opened': LINK_SIZES,
  spaces: LINK_SIZES,
};
