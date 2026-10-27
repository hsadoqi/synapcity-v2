import type { OwnedRecordSummary } from '@synapcity/domain-records';
import {
  toProviderFailure,
  type ProviderFailure,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

import { COLUMNS, countOf, recordFromRow, type OwnedRow } from '../owned-row';
import { readError } from '../read-error';

/** The record tables beside Spaces (ADR-0013): one table per kind. */
export type RecordKind = 'documents' | 'dashboards';

/** What pinning reports: the database-stamped time, or the failure by code and status. */
export type PinnedOutcome =
  { ok: true; pinnedAt: string | null } | { ok: false; error: ProviderFailure };

/** The kind's rows with the count of Spaces each takes part in. */
async function summaryRows(
  client: SupabaseServerClient,
  kind: RecordKind,
): Promise<{ row: OwnedRow; spaces: { count: number }[] }[]> {
  // One literal query per kind, so each select is checked against the schema.
  if (kind === 'documents') {
    const { data, error } = await client
      .from('documents')
      .select(`${COLUMNS}, space_documents(count)`)
      .order('created_at', { ascending: false });
    if (error) throw readError(kind, error);
    return data.map((row) => ({ row, spaces: row.space_documents }));
  }
  const { data, error } = await client
    .from('dashboards')
    .select(`${COLUMNS}, space_dashboards(count)`)
    .order('created_at', { ascending: false });
  if (error) throw readError(kind, error);
  return data.map((row) => ({ row, spaces: row.space_dashboards }));
}

/**
 * The signed-in owner's records of one kind with the number of Spaces each is
 * in, newest first. Row-level security scopes the query to the session.
 */
export async function listRecordSummaries(
  client: SupabaseServerClient,
  kind: RecordKind,
): Promise<OwnedRecordSummary[]> {
  const rows = await summaryRows(client, kind);
  return rows.map(({ row, spaces }) => ({
    ...recordFromRow(row),
    spacesTotal: countOf(spaces),
  }));
}

/**
 * Pins or unpins one of the caller's Spaces, documents or dashboards. The
 * database stamps the time, so `pinnedAt` is the server's own. Row-level
 * security limits the write to the caller's own rows, and `select` returns the
 * written row so a write it turned away cannot look saved.
 */
export async function setRecordPinned(
  client: SupabaseServerClient,
  table: 'spaces' | RecordKind,
  id: string,
  pinned: boolean,
): Promise<PinnedOutcome> {
  const { data, error } = await client
    .from(table)
    // Any non-null value means "pin"; the database replaces it with its clock.
    .update({ pinned_at: pinned ? new Date().toISOString() : null })
    .eq('id', id)
    .select('pinned_at');

  if (error) return { ok: false, error: toProviderFailure(error) };
  if (!data.length) return { ok: false, error: { code: 'row_not_written' } };
  return { ok: true, pinnedAt: data[0]?.pinned_at ?? null };
}
