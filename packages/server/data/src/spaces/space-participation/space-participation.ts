import { recordIdSchema, type BaseRecord } from '@synapcity/domain-records';
import type { SupabaseServerClient } from '@synapcity/server-supabase';

import { COLUMNS, recordFromRow, type OwnedRow } from '../../owned-row';
import { readError } from '../../read-error';
import type { ParticipantTable } from '../../records';

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
  if (!recordIdSchema.safeParse(spaceId).success) return [];

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
