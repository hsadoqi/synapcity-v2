import { baseRecordSchema } from '@synapcity/domain-records';
import { calendarDateSchema, instantSchema } from '@synapcity/domain-time';
import { z } from 'zod';

import { normalizeLinkUrl } from '../utils/normalize-link-url';

/**
 * Record kinds carried over from the responsive-grid prototype. Each one
 * extends the base record contract with its own fields. They are prototypes:
 * not in the glossary, not persisted, and free to change or go away.
 */
export const PROTOTYPE_RECORD_KINDS = [
  'metric',
  'goal',
  'habit',
  'project',
  'task',
  'event',
  'activity',
  'note',
  'link',
  'asset',
] as const;

export const prototypeRecordKindSchema = z.enum(PROTOTYPE_RECORD_KINDS);

/** Points at one record by kind and id. */
export const entityRefSchema = z.object({
  kind: prototypeRecordKindSchema,
  id: z.string().min(1),
});

export const metricSchema = baseRecordSchema.extend({
  value: z.number(),
  unit: z.string(),
  /** Free-text comparison shown under the value, for example "+1 vs last week". */
  note: z.string(),
});

export const goalSchema = baseRecordSchema.extend({
  current: z.number().nonnegative(),
  target: z.number().nonnegative(),
  unit: z.string(),
});

export const habitSchema = baseRecordSchema.extend({
  /** Local calendar days the habit was completed, as YYYY-MM-DD. */
  completedDays: z.array(calendarDateSchema),
});

export const projectSchema = baseRecordSchema;

export const taskSchema = baseRecordSchema.extend({
  projectId: z.string().min(1),
  done: z.boolean(),
  /** Ordering within the project. */
  order: z.number().int(),
});

export const calendarEventSchema = baseRecordSchema.extend({
  startsAt: instantSchema,
});

export const activitySchema = baseRecordSchema.extend({
  occurredAt: instantSchema,
  /** The record the activity is about, when there is one. */
  subject: entityRefSchema.optional(),
});

export const noteSchema = baseRecordSchema.extend({
  body: z.string(),
});

export const linkSchema = baseRecordSchema.extend({
  url: z.string().refine((url) => normalizeLinkUrl(url) === url),
});

export const assetSchema = baseRecordSchema.extend({
  /** Stable slot the asset occupies on the vision board. */
  slot: z.string().min(1),
  /**
   * Downscaled raster image as a base64 data URL. SVG is refused: it can
   * carry script.
   */
  dataUrl: z.string().regex(/^data:image\/(?:png|jpeg|webp|gif);base64,/),
});

/** The schema for each kind, for validating records loaded from storage. */
export const prototypeRecordSchemas = {
  metric: metricSchema,
  goal: goalSchema,
  habit: habitSchema,
  project: projectSchema,
  task: taskSchema,
  event: calendarEventSchema,
  activity: activitySchema,
  note: noteSchema,
  link: linkSchema,
  asset: assetSchema,
} as const;
