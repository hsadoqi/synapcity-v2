import type { BaseRecord } from '@synapcity/domain-records';
import {
  toProviderFailure,
  type ProviderFailure,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';
import { z } from 'zod';

import { COLUMNS, recordFromRow, type OwnedRow } from '../../owned-row';
import { readError } from '../../read-error';
import type { ParticipantTable } from '../../records';

const spaceIdSchema = z.uuid();

/** The embedded items of one Space's participation rows, newest addition first. */
async function participantRows(
  client: SupabaseServerClient,
  spaceId: string,
  kind: ParticipantTable,
): Promise<(OwnedRow | null)[]> {
  // One literal query per kind, so each embed is checked against the schema.
  if (kind === 'documents') {
    const { data, error } = await client
      .from('space_documents')
      .select(`documents(${COLUMNS})`)
      .eq('space_id', spaceId)
      .order('added_at', { ascending: false });
    if (error) throw readError(`documents of space ${spaceId}`, error);
    return data.map((row) => row.documents);
  }
  const { data, error } = await client
    .from('space_dashboards')
    .select(`dashboards(${COLUMNS})`)
    .eq('space_id', spaceId)
    .order('added_at', { ascending: false });
  if (error) throw readError(`dashboards of space ${spaceId}`, error);
  return data.map((row) => row.dashboards);
}

/**
 * The items taking part in one Space, newest addition first (ADR-0013:
 * participation is its own record, one table per kind). Row-level security
 * scopes both the participation rows and the embedded items to the caller.
 * A participation row whose item the caller cannot see comes back with a null
 * embed and is skipped. Per-Space `pinned` and `position` are not read yet.
 */
async function listParticipants(
  client: SupabaseServerClient,
  spaceId: string,
  kind: ParticipantTable,
): Promise<BaseRecord[]> {
  // A malformed id cannot match a uuid column; PostgREST would error instead.
  if (!spaceIdSchema.safeParse(spaceId).success) return [];

  const items = await participantRows(client, spaceId, kind);
  return items.flatMap((item) => (item ? [recordFromRow(item)] : []));
}

/** The documents taking part in one Space. */
export function listSpaceDocuments(
  client: SupabaseServerClient,
  spaceId: string,
): Promise<BaseRecord[]> {
  return listParticipants(client, spaceId, 'documents');
}

/** The dashboards taking part in one Space. */
export function listSpaceDashboards(
  client: SupabaseServerClient,
  spaceId: string,
): Promise<BaseRecord[]> {
  return listParticipants(client, spaceId, 'dashboards');
}

/**
 * What adding reports: done, or the failure by code and status. A failure
 * without a code (a dropped connection) is not proof the row was not written.
 */
export type AddedOutcome = { ok: true } | { ok: false; error: ProviderFailure };

/**
 * Adds one participation row, idempotently: a pair already in the Space is
 * left as it is (`on conflict do nothing` on the primary key), so a second add
 * neither duplicates it nor resets its per-Space `pinned` and `position`.
 * Row-level security checks the insert first: the caller must own the Space
 * and the item, or the database refuses with an error, never a silent skip.
 */
async function addParticipant(
  client: SupabaseServerClient,
  spaceId: string,
  itemId: string,
  kind: ParticipantTable,
): Promise<AddedOutcome> {
  // One literal query per kind, so each insert is checked against the schema.
  const { error, status } =
    kind === 'documents'
      ? await client
          .from('space_documents')
          .upsert(
            { space_id: spaceId, document_id: itemId },
            { onConflict: 'space_id,document_id', ignoreDuplicates: true },
          )
      : await client
          .from('space_dashboards')
          .upsert(
            { space_id: spaceId, dashboard_id: itemId },
            { onConflict: 'space_id,dashboard_id', ignoreDuplicates: true },
          );

  if (error)
    return { ok: false, error: toProviderFailure({ ...error, status }) };
  return { ok: true };
}

/** Adds one of the caller's documents to one of their Spaces. */
export function addSpaceDocument(
  client: SupabaseServerClient,
  spaceId: string,
  documentId: string,
): Promise<AddedOutcome> {
  return addParticipant(client, spaceId, documentId, 'documents');
}

/** Adds one of the caller's dashboards to one of their Spaces. */
export function addSpaceDashboard(
  client: SupabaseServerClient,
  spaceId: string,
  dashboardId: string,
): Promise<AddedOutcome> {
  return addParticipant(client, spaceId, dashboardId, 'dashboards');
}
