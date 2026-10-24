import type {
  BaseRecord,
  SpaceEntity,
  SpaceSummary,
} from '@synapcity/domain-records';

/** What pinning reports: the database-stamped time, or the error to log. */
type SetPinnedOutcome =
  { ok: true; pinnedAt: string | null } | { ok: false; error: unknown };

/**
 * Where Spaces and what takes part in them come from. Two implementations: the
 * real one over Supabase (`serverSpaceSource`) and the development fixtures
 * (`fixtureSpaceSource`). Loaders, actions and routes depend on this and never
 * on where the data lives, so a new store plugs in by implementing it.
 */
export interface SpaceSource {
  /** The owner's Spaces, newest first. */
  list(): Promise<SpaceEntity[]>;
  /** The same with the document and dashboard counts, for the index. */
  listSummaries(): Promise<SpaceSummary[]>;
  /** One Space, or null when it does not exist or is not the owner's. */
  find(spaceId: string): Promise<SpaceEntity | null>;
  setPinned(spaceId: string, pinned: boolean): Promise<SetPinnedOutcome>;
  /** Notes that the owner opened the Space; the outcome carries any error to log. */
  recordView(
    spaceId: string,
  ): Promise<{ ok: true } | { ok: false; error: unknown }>;
  /** The documents taking part in the Space (ADR-0013). */
  listDocuments(spaceId: string): Promise<BaseRecord[]>;
  /** The dashboards taking part in the Space (ADR-0013). */
  listDashboards(spaceId: string): Promise<BaseRecord[]>;
}
