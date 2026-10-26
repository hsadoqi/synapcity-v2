import { baseRecordSchema } from '@synapcity/domain-records';

/**
 * Saved-record contract for a document (ADR-0013, item 1): the base record,
 * with no fields of its own yet. Document body storage (the editor format) is
 * not decided, so nothing about the body lives here. Database adapters map
 * the snake_case columns onto these camelCase fields.
 */
export const documentSchema = baseRecordSchema;
