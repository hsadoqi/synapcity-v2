import { z } from 'zod';
import { spaceSchema } from '@synapcity/domain-records';
import type { SpaceEntity, SpaceSummary } from '@synapcity/domain-records';

import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { createClient } from '@/lib/supabase/server';

import { SPACE_FIXTURES } from '../../lib/fixtures';

const COLUMNS =
  'id, owner_id, name, description, icon, tags, created_at, updated_at, pinned_at, last_viewed_at';

/** Shape of a `public.spaces` row as PostgREST returns it (ADR-0012). */
interface SpaceRow {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  icon: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  pinned_at: string | null;
  last_viewed_at: string | null;
}

/** A row with the embedded participation counts PostgREST adds for `x(count)`. */
interface SpaceSummaryRow extends SpaceRow {
  space_documents: { count: number }[];
  space_dashboards: { count: number }[];
}

/** Maps snake_case columns and a null description onto the feature contract. */
function fromRow(row: SpaceRow): SpaceEntity {
  return spaceSchema.parse({
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description ?? undefined,
    icon: row.icon,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pinnedAt: row.pinned_at,
    lastViewedAt: row.last_viewed_at,
  });
}

/** An embedded `x(count)` comes back as `[{ count }]`; no rows means zero. */
function countOf(embedded: { count: number }[] | null | undefined) {
  return embedded?.[0]?.count ?? 0;
}

/**
 * The signed-in owner's spaces, newest first. Row-level security scopes the
 * query to the session, so no owner id is passed. Development fixture mode has
 * no session or database and reads the sample records instead.
 */
export async function listSpaces(): Promise<SpaceEntity[]> {
  if (fixtureModeEnabled()) return [...SPACE_FIXTURES];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('spaces')
    .select(COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load spaces: ${error.message}`);
  return (data satisfies SpaceRow[]).map(fromRow);
}

/**
 * The owner's spaces with how many documents and dashboards each holds, for
 * the index. Same scoping as `listSpaces`. Fixture mode has no participation
 * data, so its counts are zero.
 */
export async function listSpaceSummaries(): Promise<SpaceSummary[]> {
  if (fixtureModeEnabled()) {
    return SPACE_FIXTURES.map((space) => ({
      ...space,
      documentsTotal: 0,
      dashboardsTotal: 0,
    }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('spaces')
    .select(`${COLUMNS}, space_documents(count), space_dashboards(count)`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load spaces: ${error.message}`);
  return (data as unknown as SpaceSummaryRow[]).map((row) => ({
    ...fromRow(row),
    documentsTotal: countOf(row.space_documents),
    dashboardsTotal: countOf(row.space_dashboards),
  }));
}

/** One of the owner's spaces, or null when it does not exist or is not theirs. */
export async function findSpace(spaceId: string): Promise<SpaceEntity | null> {
  if (fixtureModeEnabled()) {
    return SPACE_FIXTURES.find((space) => space.id === spaceId) ?? null;
  }
  // A malformed id cannot match a uuid column; PostgREST would error instead.
  if (!z.uuid().safeParse(spaceId).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('spaces')
    .select(COLUMNS)
    .eq('id', spaceId)
    .maybeSingle();

  if (error)
    throw new Error(`Failed to load space ${spaceId}: ${error.message}`);
  return data ? fromRow(data satisfies SpaceRow) : null;
}
