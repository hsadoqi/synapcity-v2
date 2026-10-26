import { baseRecordSchema } from '@synapcity/domain-records';

/**
 * Saved-record contract for a dashboard (ADR-0013, item 1): the base record,
 * with no fields of its own yet. It is the record, not the composition: what a
 * dashboard shows and where is `dashboardCompositionSchema`, whose storage is
 * still open. Database adapters map the snake_case columns onto these fields.
 */
export const dashboardSchema = baseRecordSchema;
