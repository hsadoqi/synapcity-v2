import { entityRefSchema } from '@synapcity/domain-prototypes';
import { z } from 'zod';

import type { DashboardComposition } from '../types';

const placement = z.number().int().nonnegative();
const span = z.number().int().positive();

const layoutItemSchema = z.object({
  i: z.string().min(1),
  x: placement,
  y: placement,
  w: span,
  h: span,
});

const widgetBase = {
  id: z.string().min(1),
  title: z.string(),
  collapsed: z.boolean(),
  highlight: z.enum(['accent', 'neutral', 'none']),
  status: z.enum(['active', 'hidden', 'archived']),
};

/** A record-backed widget whose source must be a record of `kind`. */
function sourced<T extends string, K extends string>(type: T, kind: K) {
  return z.object({
    ...widgetBase,
    type: z.literal(type),
    source: entityRefSchema.extend({ kind: z.literal(kind) }),
  });
}

const widgetSchema = z.discriminatedUnion('type', [
  sourced('stat', 'metric'),
  sourced('progress', 'goal'),
  sourced('habit', 'habit'),
  sourced('notes', 'note'),
  sourced('tasks', 'project'),
  z.object({
    ...widgetBase,
    type: z.literal('calendar'),
    query: z.object({ range: z.literal('week') }),
  }),
  z.object({
    ...widgetBase,
    type: z.literal('feed'),
    query: z.object({ limit: z.number().int().min(1).max(50) }),
  }),
]);

/**
 * A saved dashboard composition: its settings, its widgets and a layout for
 * each breakpoint. Use it to validate a composition read back from storage.
 */
export const dashboardCompositionSchema = z.object({
  settings: z.object({
    columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    cardRadius: z.union([
      z.literal(4),
      z.literal(8),
      z.literal(12),
      z.literal(16),
    ]),
    showWidgetTitles: z.boolean(),
  }),
  widgets: z.array(widgetSchema),
  layouts: z.strictObject({
    lg: z.array(layoutItemSchema),
    md: z.array(layoutItemSchema),
    sm: z.array(layoutItemSchema),
  }),
}) satisfies z.ZodType<DashboardComposition>;
