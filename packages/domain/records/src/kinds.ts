import { z } from 'zod';

/**
 * The kinds of persisted record: each has its own table with the ten shared
 * fields (ADR-0012, ADR-0013). Singular, as the product and the fixtures name
 * them; table names are the data layer's mapping, not this list. Adding a
 * kind is a migration first, so this list changes with one.
 */
export const RECORD_KINDS = ['space', 'document', 'dashboard'] as const;

/** One of the persisted record kinds ({@link RECORD_KINDS}). */
export const recordKindSchema = z.enum(RECORD_KINDS);

/** One of the persisted record kinds: `space`, `document` or `dashboard`. */
export type RecordKind = z.infer<typeof recordKindSchema>;

/** True when `value` is one of the persisted record kinds, for input from outside. */
export function isRecordKind(value: unknown): value is RecordKind {
  return (RECORD_KINDS as readonly unknown[]).includes(value);
}
