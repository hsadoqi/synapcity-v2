import type { SpaceEntity, SpaceSummary } from '@synapcity/domain-spaces';
import type { SupabaseServerClient } from '@synapcity/server-supabase';
import { z } from 'zod';

import {
  COLUMNS,
  countOf,
  fromRow,
  type OwnedRow,
  type SpaceSummaryRow,
} from '../../owned-row';
import { readError } from '../../read-error';

const spaceIdSchema = z.uuid();

/**
 * The signed-in owner's spaces, newest first. Row-level security scopes the
 * query to the session, so no owner id is passed.
 */
export async function listSpaces(
  client: SupabaseServerClient,
): Promise<SpaceEntity[]> {
  const { data, error } = await client
    .from('spaces')
    .select(COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw readError('spaces', error);
  return (data satisfies OwnedRow[]).map(fromRow);
}

/**
 * The owner's spaces with how many documents and dashboards each holds, for
 * the index. Same scoping as `listSpaces`.
 */
export async function listSpaceSummaries(
  client: SupabaseServerClient,
): Promise<SpaceSummary[]> {
  const { data, error } = await client
    .from('spaces')
    .select(`${COLUMNS}, space_documents(count), space_dashboards(count)`)
    .order('created_at', { ascending: false });

  if (error) throw readError('spaces', error);
  return (data satisfies SpaceSummaryRow[]).map((row) => ({
    ...fromRow(row),
    documentsTotal: countOf(row.space_documents),
    dashboardsTotal: countOf(row.space_dashboards),
  }));
}

/** One of the owner's spaces, or null when it does not exist or is not theirs. */
export async function findSpace(
  client: SupabaseServerClient,
  spaceId: string,
): Promise<SpaceEntity | null> {
  // A malformed id cannot match a uuid column; PostgREST would error instead.
  if (!spaceIdSchema.safeParse(spaceId).success) return null;

  const { data, error } = await client
    .from('spaces')
    .select(COLUMNS)
    .eq('id', spaceId)
    .maybeSingle();

  if (error) throw readError(`space ${spaceId}`, error);
  return data ? fromRow(data satisfies OwnedRow) : null;
}
