import type { z } from 'zod';

import type {
  activitySchema,
  assetSchema,
  calendarEventSchema,
  goalSchema,
  habitSchema,
  linkSchema,
  metricSchema,
  noteSchema,
  projectSchema,
  prototypeRecordKindSchema,
  taskSchema,
} from '../schemas';

export type Metric = z.infer<typeof metricSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Habit = z.infer<typeof habitSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Task = z.infer<typeof taskSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Note = z.infer<typeof noteSchema>;
export type Link = z.infer<typeof linkSchema>;
export type Asset = z.infer<typeof assetSchema>;

export type PrototypeRecordKind = z.infer<typeof prototypeRecordKindSchema>;

export type PrototypeRecordKindMap = {
  metric: Metric;
  goal: Goal;
  habit: Habit;
  project: Project;
  task: Task;
  event: CalendarEvent;
  activity: Activity;
  note: Note;
  link: Link;
  asset: Asset;
};

/** Points at one record by kind and id; the kind narrows what it resolves to. */
export type EntityRef<K extends PrototypeRecordKind = PrototypeRecordKind> = {
  kind: K;
  id: string;
};

/** Every prototype record, one table per kind, keyed by record id. */
export type PrototypeRecords = {
  [K in PrototypeRecordKind]: Record<string, PrototypeRecordKindMap[K]>;
};

/** Who is creating a record and when (epoch milliseconds). */
export type RecordContext = { ownerId: string; now: number };
