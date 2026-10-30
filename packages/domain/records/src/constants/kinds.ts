/**
 * The kinds of persisted record: each has its own table with the ten shared
 * fields (ADR-0012, ADR-0013). Singular, as the product and the fixtures name
 * them; the table names are the data layer's mapping, not this list. Adding a
 * kind is a migration first, so this list changes with one.
 */
export const RECORD_KINDS = ['space', 'document', 'dashboard'] as const;
