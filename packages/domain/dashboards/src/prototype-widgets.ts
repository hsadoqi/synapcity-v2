/*
 * Provisional bridge (workspace conventions, domain packages): the widgets
 * that show one prototype record depend on @synapcity/domain-prototypes for
 * the record reference. They stay in the Widget union because compositions
 * saved in the browser hold them. Removal condition: the widget source model
 * that PRODUCT.md leaves open is decided. See the package README.
 */
import { entityRefSchema, type EntityRef } from '@synapcity/domain-prototypes';
import { z } from 'zod';

import {
  objectFor,
  widgetBaseShape,
  type UnknownKeys,
  type WidgetBase,
} from './widget-base';

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

/** The schemas of the record-backed widgets, in the composition's order. */
export function recordBackedWidgetSchemas(keys: UnknownKeys) {
  const object = objectFor(keys);
  /** A record-backed widget whose source must be a record of `kind`. */
  const sourced = <T extends string, K extends string>(type: T, kind: K) =>
    object({
      ...widgetBaseShape,
      type: z.literal(type),
      source: object({ ...entityRefSchema.shape, kind: z.literal(kind) }),
    });
  return [
    sourced('stat', 'metric'),
    sourced('progress', 'goal'),
    sourced('habit', 'habit'),
    sourced('notes', 'note'),
    sourced('tasks', 'project'),
  ] as const;
}
