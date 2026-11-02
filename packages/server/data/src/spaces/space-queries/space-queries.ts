import {
  spaceSchema,
  type SpaceEntity,
  type SpaceSummary,
} from '@synapcity/domain-spaces';
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

export type SpaceRelationType = 'dashboards' | 'documents';

/**
 * The participation columns read for a Space's relations (ADR-0013): the
 * pair and its per-Space presentation. The owner is left out; it is always
 * the caller, as row-level security returns only their rows.
 */
const DOCUMENT_LINK_COLUMNS =
  'space_id, document_id, pinned, position, added_at';
const DASHBOARD_LINK_COLUMNS =
  'space_id, dashboard_id, pinned, position, added_at';

/** One `space_documents` row as `DOCUMENT_LINK_COLUMNS` reads it. */
export type SpaceDocumentLink = {
  space_id: string;
  document_id: string;
  pinned: boolean;
  position: number | null;
  added_at: string;
};

/** One `space_dashboards` row as `DASHBOARD_LINK_COLUMNS` reads it. */
export type SpaceDashboardLink = {
  space_id: string;
  dashboard_id: string;
  pinned: boolean;
  position: number | null;
  added_at: string;
};

/**
 * A Space with its participation rows, newest addition first: only the kind
 * asked for, or both when no kind is given.
 */
export type SpaceRelationsResult<T extends SpaceRelationType | undefined> =
  T extends 'documents'
    ? SpaceEntity & { space_documents: SpaceDocumentLink[] }
    : T extends 'dashboards'
      ? SpaceEntity & { space_dashboards: SpaceDashboardLink[] }
      : SpaceEntity & {
          space_documents: SpaceDocumentLink[];
          space_dashboards: SpaceDashboardLink[];
        };

/** Newest addition first, for the participation rows embedded under `table`. */
const newestAddedIn = (table: `space_${SpaceRelationType}`) =>
  ({ referencedTable: table, ascending: false }) as const;

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

/** What navigation shows of a Space: the Space contract's display fields. */
const spaceNavItemSchema = spaceSchema.pick({
  id: true,
  name: true,
  description: true,
  icon: true,
  tags: true,
  updatedAt: true,
});

export type SpaceNavItem = Pick<
  SpaceEntity,
  'id' | 'name' | 'description' | 'icon' | 'tags' | 'updatedAt'
>;

/**
 * The owner's Spaces as navigation lists them: only the display fields, pinned
 * first (most recently pinned on top), then the most recently changed, the
 * order the sidebar uses. Row-level security scopes the query to the session.
 */
export async function listSpaceNavItems(
  client: SupabaseServerClient,
): Promise<SpaceNavItem[]> {
  const { data, error } = await client
    .from('spaces')
    .select('id, name, description, icon, tags, updated_at')
    .order('pinned_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) throw readError('spaces', error);
  return data.map((row) =>
    spaceNavItemSchema.parse({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      icon: row.icon,
      tags: row.tags,
      updatedAt: row.updated_at,
    }),
  );
}

/**
 * Every one of the owner's Spaces, newest first, each with the participation
 * rows of its documents and dashboards, newest addition first: which items
 * are in which Space, in one query. The rows say what takes part, not what the
 * items are; `listSpaceDocuments` and `listSpaceDashboards` read the items.
 * Row-level security scopes the Spaces and the rows to the session.
 */
export async function listSpacesWithRelations(
  client: SupabaseServerClient,
): Promise<SpaceRelationsResult<undefined>[]> {
  const { data, error } = await client
    .from('spaces')
    .select(
      `${COLUMNS}, space_documents(${DOCUMENT_LINK_COLUMNS}), space_dashboards(${DASHBOARD_LINK_COLUMNS})`,
    )
    .order('created_at', { ascending: false })
    .order('added_at', newestAddedIn('space_documents'))
    .order('added_at', newestAddedIn('space_dashboards'));

  if (error) throw readError('spaces', error);

  return data.map((row) => ({
    ...fromRow(row satisfies OwnedRow),
    space_documents: row.space_documents satisfies SpaceDocumentLink[],
    space_dashboards: row.space_dashboards satisfies SpaceDashboardLink[],
  }));
}

/**
 * One of the owner's Spaces with its participation rows, newest addition
 * first: the documents' rows, the dashboards' rows, or both when no `type` is
 * given. Only the kind asked for is read. Null when the Space does not exist,
 * is not the caller's, or the id is malformed, as with `findSpace`.
 */
export function getSpaceRelations(
  client: SupabaseServerClient,
  spaceId: string,
  type: 'documents',
): Promise<SpaceRelationsResult<'documents'> | null>;
export function getSpaceRelations(
  client: SupabaseServerClient,
  spaceId: string,
  type: 'dashboards',
): Promise<SpaceRelationsResult<'dashboards'> | null>;
export function getSpaceRelations(
  client: SupabaseServerClient,
  spaceId: string,
  type?: undefined,
): Promise<SpaceRelationsResult<undefined> | null>;
export function getSpaceRelations(
  client: SupabaseServerClient,
  spaceId: string,
  type?: SpaceRelationType,
): Promise<SpaceRelationsResult<SpaceRelationType | undefined> | null>;
export async function getSpaceRelations(
  client: SupabaseServerClient,
  spaceId: string,
  type?: SpaceRelationType,
): Promise<SpaceRelationsResult<SpaceRelationType | undefined> | null> {
  // A malformed id cannot match a uuid column; PostgREST would error instead.
  if (!spaceIdSchema.safeParse(spaceId).success) return null;

  // One literal query per kind, so each embed is checked against the schema.
  if (type === 'documents') {
    const { data, error } = await client
      .from('spaces')
      .select(`${COLUMNS}, space_documents(${DOCUMENT_LINK_COLUMNS})`)
      .eq('id', spaceId)
      .order('added_at', newestAddedIn('space_documents'))
      .maybeSingle();
    if (error) throw readError(`space ${spaceId}`, error);
    if (!data) return null;
    return {
      ...fromRow(data satisfies OwnedRow),
      space_documents: data.space_documents satisfies SpaceDocumentLink[],
    };
  }

  if (type === 'dashboards') {
    const { data, error } = await client
      .from('spaces')
      .select(`${COLUMNS}, space_dashboards(${DASHBOARD_LINK_COLUMNS})`)
      .eq('id', spaceId)
      .order('added_at', newestAddedIn('space_dashboards'))
      .maybeSingle();
    if (error) throw readError(`space ${spaceId}`, error);
    if (!data) return null;
    return {
      ...fromRow(data satisfies OwnedRow),
      space_dashboards: data.space_dashboards satisfies SpaceDashboardLink[],
    };
  }

  const { data, error } = await client
    .from('spaces')
    .select(
      `${COLUMNS}, space_documents(${DOCUMENT_LINK_COLUMNS}), space_dashboards(${DASHBOARD_LINK_COLUMNS})`,
    )
    .eq('id', spaceId)
    .order('added_at', newestAddedIn('space_documents'))
    .order('added_at', newestAddedIn('space_dashboards'))
    .maybeSingle();
  if (error) throw readError(`space ${spaceId}`, error);
  if (!data) return null;
  return {
    ...fromRow(data satisfies OwnedRow),
    space_documents: data.space_documents satisfies SpaceDocumentLink[],
    space_dashboards: data.space_dashboards satisfies SpaceDashboardLink[],
  };
}
