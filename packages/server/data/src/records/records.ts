import {
  type BaseRecord,
  type BaseRecordCreate,
} from '@synapcity/domain-records';
import {
  toProviderFailure,
  type ProviderFailure,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';
import { z } from 'zod';

import { COLUMNS, countOf, recordFromRow, type OwnedRow } from '../owned-row';
import { readError } from '../read-error';

/** The persisted kinds this adapter maps to concrete database tables. */
export type RecordKind = 'space' | 'document' | 'dashboard';

/** The table each persisted record kind lives in (ADR-0012, ADR-0013). */
export const RECORD_TABLES = {
  space: 'spaces',
  document: 'documents',
  dashboard: 'dashboards',
} as const satisfies Record<RecordKind, string>;

/** A table that holds one kind of persisted record. */
export type RecordTable = (typeof RECORD_TABLES)[RecordKind];

/** The record tables that take part in Spaces (ADR-0013): every one but `spaces`. */
export type ParticipantTable = Exclude<RecordTable, 'spaces'>;

/** A document or dashboard index row with its contextual participation count. */
export type RecordSummary = BaseRecord & { spacesTotal: number };

const persistedRecordIdSchema = z.uuid();

/** What pinning reports: the database-stamped time, or the failure by code and status. */
export type PinnedOutcome =
  { ok: true; pinnedAt: string | null } | { ok: false; error: ProviderFailure };

/** The kind's rows with the count of Spaces each takes part in. */
async function summaryRows(
  client: SupabaseServerClient,
  kind: ParticipantTable,
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
  kind: ParticipantTable,
): Promise<RecordSummary[]> {
  const rows = await summaryRows(client, kind);
  return rows.map(({ row, spaces }) => ({
    ...recordFromRow(row),
    spacesTotal: countOf(spaces),
  }));
}

/** Singular names for read errors. */
const SINGULAR: Record<ParticipantTable, RecordKind> = {
  documents: 'document',
  dashboards: 'dashboard',
};

/**
 * One of the owner's documents or dashboards, or null when it does not exist
 * or is not theirs. Row-level security scopes the query to the session, so a
 * record another person owns reads as missing, never as forbidden.
 */
export async function findRecord(
  client: SupabaseServerClient,
  kind: ParticipantTable,
  id: string,
): Promise<BaseRecord | null> {
  // A malformed id cannot match a uuid column; PostgREST would error instead.
  if (!persistedRecordIdSchema.safeParse(id).success) return null;

  const { data, error } = await client
    .from(kind)
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw readError(`${SINGULAR[kind]} ${id}`, error);
  return data ? recordFromRow(data satisfies OwnedRow) : null;
}

/**
 * Pins or unpins one of the caller's Spaces, documents or dashboards. The
 * database stamps the time, so `pinnedAt` is the server's own. Row-level
 * security limits the write to the caller's own rows, and `select` returns the
 * written row so a write it turned away cannot look saved.
 */
export async function setRecordPinned(
  client: SupabaseServerClient,
  table: RecordTable,
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

/**
 * What creating reports: the new row's id, or the failure by code and status.
 * A failure with a code came from the database or PostgREST, so nothing was
 * written. A failure without one (a dropped connection, a gateway timeout) is
 * not proof either way: the row may exist.
 */
export type CreatedOutcome =
  { ok: true; id: string } | { ok: false; error: ProviderFailure };

/**
 * Creates one of the caller's Spaces, documents or dashboards from a parsed
 * create input (`baseRecordCreateSchema`). Fields the input leaves out (icon,
 * tags, description), the id, the owner and the times come from the column
 * defaults: the owner is the session's user, and row-level security refuses
 * any other.
 */
export async function createRecord(
  client: SupabaseServerClient,
  table: RecordTable,
  input: BaseRecordCreate,
): Promise<CreatedOutcome> {
  const { data, error, status } = await client
    .from(table)
    .insert(input)
    .select('id')
    .single();

  if (error)
    return { ok: false, error: toProviderFailure({ ...error, status }) };
  return { ok: true, id: data.id };
}

/** A view recorded less than this long ago is not recorded again. */
const VIEW_THROTTLE_MS = 60_000;

/**
 * Notes that the caller opened one of their Spaces, documents or dashboards.
 * Skipped when the last view was under a minute ago. The outcome carries the
 * error so the host can log it; a view that was not recorded is not worth
 * interrupting anyone for.
 */
export async function recordRecordView(
  client: SupabaseServerClient,
  table: RecordTable,
  id: string,
  now: Date,
): Promise<{ ok: true } | { ok: false; error: ProviderFailure }> {
  const cutoff = new Date(now.getTime() - VIEW_THROTTLE_MS).toISOString();
  const { error } = await client
    .from(table)
    .update({ last_viewed_at: now.toISOString() })
    .eq('id', id)
    .or(`last_viewed_at.is.null,last_viewed_at.lt.${cutoff}`);

  return error ? { ok: false, error: toProviderFailure(error) } : { ok: true };
}
