/**
 * What the sidebar shows of one record: enough to name it and link to it, and
 * its stored Lucide icon name when it has one (a Space's shows in the switcher).
 */
export type SidebarRecord = { id: string; name: string; icon?: string };

/** The few records of each kind the signed-in sidebar lists. */
export type SidebarRecords = {
  spaces: SidebarRecord[];
  documents: SidebarRecord[];
  dashboards: SidebarRecord[];
};

/** How many of each kind the sidebar lists. */
export const SIDEBAR_RECORD_LIMIT = 8;

export const NO_SIDEBAR_RECORDS: SidebarRecords = {
  spaces: [],
  documents: [],
  dashboards: [],
};

type Sortable = SidebarRecord & {
  pinnedAt?: string | null;
  updatedAt?: string;
};

/**
 * The sidebar's order: pinned first (most recently pinned on top), then by
 * when they last changed. Equal records compare as equal, so a stable sort
 * keeps their input order. Times compare as plain text, the way the database
 * returns them in one format; `localeCompare` would put `00:00:00.5` before
 * `00:00:00`, as it weighs punctuation differently. `listLatestSpaces` and
 * `listLatestRecords` in `@synapcity/server-data` apply the same order in SQL.
 */
export function byLatest(a: Sortable, b: Sortable): number {
  if (Boolean(a.pinnedAt) !== Boolean(b.pinnedAt)) {
    return a.pinnedAt ? -1 : 1;
  }
  if (a.pinnedAt && b.pinnedAt && a.pinnedAt !== b.pinnedAt) {
    return a.pinnedAt < b.pinnedAt ? 1 : -1;
  }
  const aUpdated = a.updatedAt ?? '';
  const bUpdated = b.updatedAt ?? '';
  if (aUpdated === bUpdated) return 0;
  return aUpdated < bUpdated ? 1 : -1;
}

/**
 * Pinned records first (most recently pinned on top), then the rest by when
 * they last changed, cut to `limit` and reduced to what the sidebar needs.
 * The sort is stable, so input already in this order (the bounded reads')
 * keeps it exactly.
 */
export function latestRecords(
  records: readonly Sortable[],
  limit = SIDEBAR_RECORD_LIMIT,
): SidebarRecord[] {
  return [...records]
    .sort(byLatest)
    .slice(0, limit)
    .map(({ id, name, icon }) => (icon ? { id, name, icon } : { id, name }));
}
