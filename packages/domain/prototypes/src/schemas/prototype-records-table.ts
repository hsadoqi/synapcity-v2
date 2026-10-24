import { z } from 'zod';

import {
  activitySchema,
  assetSchema,
  calendarEventSchema,
  goalSchema,
  habitSchema,
  linkSchema,
  metricSchema,
  noteSchema,
  projectSchema,
  taskSchema,
} from './prototype-records';

/** A table of records keyed by id; each record must sit under its own id. */
function tableOf<T extends { id: string }>(schema: z.ZodType<T>) {
  return z
    .record(z.string(), schema)
    .refine(
      (table) =>
        Object.entries(table).every(([id, record]) => record.id === id),
      { message: 'Each record is stored under its own id.' },
    );
}

/** Every prototype record, one table per kind, as saved together. */
export const prototypeRecordsSchema = z.strictObject({
  metric: tableOf(metricSchema),
  goal: tableOf(goalSchema),
  habit: tableOf(habitSchema),
  project: tableOf(projectSchema),
  task: tableOf(taskSchema),
  event: tableOf(calendarEventSchema),
  activity: tableOf(activitySchema),
  note: tableOf(noteSchema),
  link: tableOf(linkSchema),
  asset: tableOf(assetSchema),
});
