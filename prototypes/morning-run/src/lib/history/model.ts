import { z } from 'zod';

import { destinationSchema } from '@/lib/runs/destinations';
import { focusPlanSchema } from '@/lib/focus';
import { intentionSchema } from '@/lib/intention';

const routedCardSchema = z.object({
  dest: destinationSchema,
  title: z.string(),
  from: z.string(),
  headline: z.string(),
  detail: z.string(),
  note: z.string(),
  empty: z.boolean(),
  items: z.array(z.string()),
});

const historyEntrySchema = z.object({
  id: z.string(),
  runId: z.string(),
  runName: z.string(),
  group: z.string(),
  startedAt: z.string(),
  completedAt: z.string(),
  /** Time actually spent, not the planned time. */
  durationSec: z.number().min(0),
  totalSteps: z.number().int(),
  answered: z.number().int(),
  skipped: z.number().int(),
  energy: z.number().int().min(1).max(10).nullable(),
  intention: intentionSchema,
  focusPlan: focusPlanSchema.nullable().optional(),
  cards: z.array(routedCardSchema),
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export const historySchema = z.array(historyEntrySchema).max(500);
export const MAX_HISTORY = 500;
