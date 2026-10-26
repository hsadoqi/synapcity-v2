import type { BaseRecord } from '@synapcity/domain-records';
import type { SupabaseServerClient } from '@synapcity/server-supabase';

import { COLUMNS, countOf, type OwnedRow } from '../../owned-row';

/**
 * Documents and dashboards are saved the same way (ADR-0013): the same columns
 * as spaces, one table per kind, and one participation table per kind that
 * says which Spaces an item is in.
 */
export type OwnedRecordTable = 'documents' | 'dashboards';

const PARTICIPATION = {
  documents: 'space_documents',
  dashboards: 'space_dashboards',
} as const;

/** A row with the embedded participation count PostgREST adds for `x(count)`. */
type SummaryRow = OwnedRow & {
  [participation: string]: { count: number }[] | unknown;
};

/**
 * The signed-in owner's records of one kind with the number of Spaces each is
 * in, newest first. Row-level security scopes the query to the session, so no
 * owner id is passed. `toRecord` is the kind's own contract, so a malformed row
 * throws instead of reaching the page.
 */
export async function listOwnedRecordSummaries<Record extends BaseRecord>(
  client: SupabaseServerClient,
  table: OwnedRecordTable,
  toRecord: (row: OwnedRow) => Record,
): Promise<(Record & { spacesTotal: number })[]> {
  const participation = PARTICIPATION[table];
  const { data, error } = await client
    .from(table)
    .select(`${COLUMNS}, ${participation}(count)`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load ${table}: ${error.message}`);
  return (data as unknown as SummaryRow[]).map((row) => ({
    ...toRecord(row),
    spacesTotal: countOf(row[participation] as { count: number }[]),
  }));
}

/**
 * Pins or unpins one of the caller's records. The database stamps the time, so
 * the returned `pinnedAt` is the server's own. `select` returns the written row
 * so a write that row-level security turned away cannot look saved.
 */
export async function setOwnedRecordPinned(
  client: SupabaseServerClient,
  table: OwnedRecordTable,
  id: string,
  pinned: boolean,
): Promise<
  { ok: true; pinnedAt: string | null } | { ok: false; error: unknown }
> {
  const { data, error } = await client
    .from(table)
    // Any non-null value means "pin"; the database replaces it with its clock.
    .update({ pinned_at: pinned ? new Date().toISOString() : null })
    .eq('id', id)
    .select('pinned_at');

  if (error || !data?.length) {
    return { ok: false, error: error ?? { code: 'row_not_written' } };
  }
  return { ok: true, pinnedAt: data[0]?.pinned_at ?? null };
}
