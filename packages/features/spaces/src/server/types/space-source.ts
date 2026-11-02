import type { BaseRecord, BaseRecordCreate } from '@synapcity/domain-records';
import type { SpaceEntity, SpaceSummary } from '@synapcity/domain-spaces';
import type {
  SpaceNavItem,
  SpaceRelationsResult,
  SpaceRelationType,
} from '@synapcity/server-data';
import type { ProviderFailure } from '@synapcity/server-supabase';

/**
 * What pinning reports: the database-stamped time, or the failure to log, by
 * code and status only. Every source reports this shape, so the host logs it
 * without a cast.
 */
export type SetPinnedOutcome =
  { ok: true; pinnedAt: string | null } | { ok: false; error: ProviderFailure };

/**
 * What adding a document or dashboard to a Space reports: done (including when
 * it was already there), or the failure to log.
 */
type AddedOutcome = { ok: true } | { ok: false; error: ProviderFailure };

/**
 * One Space's participation rows: of the kind asked for, or both kinds when
 * none is given; null when there is no such Space for the owner. The result's
 * type follows the kind passed.
 */
type GetRelations = {
  (
    spaceId: string,
    type: 'documents',
  ): Promise<SpaceRelationsResult<'documents'> | null>;
  (
    spaceId: string,
    type: 'dashboards',
  ): Promise<SpaceRelationsResult<'dashboards'> | null>;
  (
    spaceId: string,
    type?: undefined,
  ): Promise<SpaceRelationsResult<undefined> | null>;
  (
    spaceId: string,
    type?: SpaceRelationType,
  ): Promise<SpaceRelationsResult<SpaceRelationType | undefined> | null>;
};

/** What creating reports: the new Space's id, or the failure to log. */
export type CreatedOutcome =
  { ok: true; id: string } | { ok: false; error: ProviderFailure };

/**
 * Where Spaces and what takes part in them come from. Two implementations: the
 * real one over Supabase (`serverSpaceSource`) and the host's fixture-mode demo
 * source. The loader, and the host's actions and routes, depend on this and
 * never on where the data lives, so a new store plugs in by implementing it.
 */
export interface SpaceSource {
  /** The owner's Spaces, newest first. */
  list(): Promise<SpaceEntity[]>;
  /** The same with the document and dashboard counts, for the index. */
  listSummaries(): Promise<SpaceSummary[]>;
  /**
   * The owner's Spaces as navigation lists them: display fields only, pinned
   * first, then the most recently changed.
   */
  listNavItems(): Promise<SpaceNavItem[]>;
  /**
   * Every Space, newest first, with its participation rows (which items are
   * in it, not the items themselves), newest addition first.
   */
  listWithRelations(): Promise<SpaceRelationsResult<undefined>[]>;
  getRelations: GetRelations;
  /** One Space, or null when it does not exist or is not the owner's. */
  find(spaceId: string): Promise<SpaceEntity | null>;
  /**
   * Creates one of the owner's Spaces from a parsed create input; the owner
   * and every omitted field come from the store.
   */
  create(input: BaseRecordCreate): Promise<CreatedOutcome>;
  setPinned(spaceId: string, pinned: boolean): Promise<SetPinnedOutcome>;
  /** Notes that the owner opened the Space; the outcome carries any error to log. */
  recordView(
    spaceId: string,
  ): Promise<{ ok: true } | { ok: false; error: ProviderFailure }>;
  /** The documents taking part in the Space (ADR-0013). */
  listDocuments(spaceId: string): Promise<BaseRecord[]>;
  /** The dashboards taking part in the Space (ADR-0013). */
  listDashboards(spaceId: string): Promise<BaseRecord[]>;
  /**
   * Adds one of the owner's documents to one of their Spaces. Idempotent: a
   * document already there is left as it is and reported as added. Ownership
   * of the document does not move (ADR-0013).
   */
  addDocument(spaceId: string, documentId: string): Promise<AddedOutcome>;
  /** The same for one of the owner's dashboards. */
  addDashboard(spaceId: string, dashboardId: string): Promise<AddedOutcome>;
}
