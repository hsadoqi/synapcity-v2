import { baseRecordSchema } from '@synapcity/domain-records';
import { z } from 'zod';

/** The app's document/dashboard index projection. */
export const recordSummarySchema = baseRecordSchema.extend({
  spacesTotal: z.number().int().nonnegative(),
});

export type RecordSummary = z.infer<typeof recordSummarySchema>;
