import { baseRecordSchema } from '@synapcity/domain-records';
import type { BaseRecord } from '@synapcity/domain-records';
import { spaceSchema } from '@synapcity/domain-spaces';
import type { SpaceEntity } from '@synapcity/domain-spaces';

export const COLUMNS =
  'id, owner_id, name, description, icon, tags, created_at, updated_at, pinned_at, last_viewed_at';

/**
 * Shape of a `public.spaces`, `public.documents` or `public.dashboards` row as
 * PostgREST returns it (ADR-0012, ADR-0013): the three tables share these
 * columns.
 */
export interface OwnedRow {
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

/** A Space row with the embedded participation counts PostgREST adds for `x(count)`. */
export interface SpaceSummaryRow extends OwnedRow {
  space_documents: { count: number }[];
  space_dashboards: { count: number }[];
}

/** Maps snake_case columns and a null description onto the contracts' field names, before a kind's schema parses them. */
export function fieldsFromRow(row: OwnedRow) {
  return {
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
  };
}

/** A Space row as the Space contract. */
export function fromRow(row: OwnedRow): SpaceEntity {
  return spaceSchema.parse(fieldsFromRow(row));
}

/** A document or dashboard row as the base record contract. */
export function recordFromRow(row: OwnedRow): BaseRecord {
  return baseRecordSchema.parse(fieldsFromRow(row));
}

/** An embedded `x(count)` comes back as `[{ count }]`; no rows means zero. */
export function countOf(embedded: { count: number }[] | null | undefined) {
  return embedded?.[0]?.count ?? 0;
}
