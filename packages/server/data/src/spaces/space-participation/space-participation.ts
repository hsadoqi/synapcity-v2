import type { BaseRecord } from '@synapcity/domain-records';
import type { SupabaseServerClient } from '@synapcity/server-supabase';
import { z } from 'zod';

import { COLUMNS, recordFromRow, type OwnedRow } from '../space-row';

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
  table: 'space_documents' | 'space_dashboards',
  embedded: 'documents' | 'dashboards',
): Promise<BaseRecord[]> {
  // A malformed id cannot match a uuid column; PostgREST would error instead.
  if (!z.uuid().safeParse(spaceId).success) return [];

  const { data, error } = await client
    .from(table)
    .select(`${embedded}(${COLUMNS})`)
    .eq('space_id', spaceId)
    .order('added_at', { ascending: false });

  if (error) {
    throw new Error(
      `Failed to load ${embedded} of space ${spaceId}: ${error.message}`,
    );
  }
  const rows = data as unknown as Record<string, OwnedRow | null>[];
  return rows.flatMap((row) => {
    const item = row[embedded];
    return item ? [recordFromRow(item)] : [];
  });
}

/** The documents taking part in one Space. */
export function listSpaceDocuments(
  client: SupabaseServerClient,
  spaceId: string,
): Promise<BaseRecord[]> {
  return listParticipants(client, spaceId, 'space_documents', 'documents');
}

/** The dashboards taking part in one Space. */
export function listSpaceDashboards(
  client: SupabaseServerClient,
  spaceId: string,
): Promise<BaseRecord[]> {
  return listParticipants(client, spaceId, 'space_dashboards', 'dashboards');
}
