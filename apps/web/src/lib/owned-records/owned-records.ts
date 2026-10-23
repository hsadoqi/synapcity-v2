import { z } from 'zod';

import type { createClient } from '@/lib/supabase/server';

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Documents and dashboards are saved the same way (ADR-0013): the same fields
 * as spaces, one table per kind, and one participation table per kind that
 * says which spaces an item is in.
 */
export type OwnedRecordTable = 'documents' | 'dashboards';

const PARTICIPATION = {
  documents: 'space_documents',
  dashboards: 'space_dashboards',
} as const;

const timestampSchema = z.iso.datetime({ offset: true });

/** A saved document or dashboard, as the app uses it. */
export const ownedRecordSchema = z.object({
  id: z.string().min(1),
  ownerId: z.uuid(),
  name: z.string().trim().min(1),
  description: z.string().optional(),
  // A Lucide identifier, never a component or markup.
  icon: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  tags: z.array(z.string()),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  pinnedAt: timestampSchema.nullable().default(null),
  lastViewedAt: timestampSchema.nullable().default(null),
});

export type OwnedRecord = z.infer<typeof ownedRecordSchema>;

/** What pinning a record reports back; `pinnedAt` is the server's own time. */
export type SetRecordPinnedResult =
  | { ok: true; pinnedAt: string | null }
  | { ok: false; error: string; signedOut?: boolean };

/** A record as an index lists it, with how many spaces it is in. */
export type OwnedRecordSummary = OwnedRecord & { spacesTotal: number };

const COLUMNS =
  'id, owner_id, name, description, icon, tags, created_at, updated_at, pinned_at, last_viewed_at';

/** A row as PostgREST returns it, with the participation count `x(count)` embeds. */
interface Row {
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
  [participation: string]: unknown;
}

function fromRow(row: Row): OwnedRecord {
  return ownedRecordSchema.parse({
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
function countOf(embedded: unknown) {
  const first = (embedded as { count: number }[] | null | undefined)?.[0];
  return first?.count ?? 0;
}

/**
 * The signed-in owner's records of one kind with the number of spaces each is
 * in, newest first. Row-level security scopes the query to the session.
 */
export async function listOwnedRecordSummaries(
  supabase: Supabase,
  table: OwnedRecordTable,
): Promise<OwnedRecordSummary[]> {
  const participation = PARTICIPATION[table];
  const { data, error } = await supabase
    .from(table)
    .select(`${COLUMNS}, ${participation}(count)`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load ${table}: ${error.message}`);
  return (data as unknown as Row[]).map((row) => ({
    ...fromRow(row),
    spacesTotal: countOf(row[participation]),
  }));
}

/**
 * Pins or unpins one of the caller's records. The database stamps the time, so
 * the returned `pinnedAt` is the server's own. `select` returns the written row
 * so a write that row-level security turned away cannot look saved.
 */
export async function setOwnedRecordPinned(
  supabase: Supabase,
  table: OwnedRecordTable,
  id: string,
  pinned: boolean,
): Promise<
  { ok: true; pinnedAt: string | null } | { ok: false; error: unknown }
> {
  const { data, error } = await supabase
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
