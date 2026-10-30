import type { BaseRecord, BaseRecordCreate } from '@synapcity/domain-records';
import type { SpaceEntity, SpaceSummary } from '@synapcity/domain-spaces';
import type { ProviderFailure } from '@synapcity/server-supabase';

/**
 * What pinning reports: the database-stamped time, or the failure to log, by
 * code and status only. Every source reports this shape, so the host logs it
 * without a cast.
 */
export type SetPinnedOutcome =
  { ok: true; pinnedAt: string | null } | { ok: false; error: ProviderFailure };

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
}
