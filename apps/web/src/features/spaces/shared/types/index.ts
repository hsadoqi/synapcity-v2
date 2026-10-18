import type { SpaceEntity } from '@synapcity/frontend-ui/types/entity';

export * from '@synapcity/frontend-ui/types/entity';

/** What pinning a space reports back; `pinnedAt` is the server's own time. */
export type SetSpacePinnedResult =
  | { ok: true; pinnedAt: string | null }
  | { ok: false; error: string; signedOut?: boolean };

/**
 * A space as the index lists it: the saved record plus how many documents and
 * dashboards take part in it. The counts are derived, not stored on the space.
 */
export type SpaceSummary = SpaceEntity & {
  documentsTotal: number;
  dashboardsTotal: number;
};
