/** What the sidebar shows of one record: enough to name it and link to it. */
export type SidebarRecord = { id: string; name: string };

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
 * Pinned records first (most recently pinned on top), then the rest by when
 * they last changed, cut to `limit` and reduced to what the sidebar needs.
 */
export function latestRecords(
  records: readonly Sortable[],
  limit = SIDEBAR_RECORD_LIMIT,
): SidebarRecord[] {
  return [...records]
    .sort((a, b) => {
      if (Boolean(a.pinnedAt) !== Boolean(b.pinnedAt)) {
        return a.pinnedAt ? -1 : 1;
      }
      if (a.pinnedAt && b.pinnedAt && a.pinnedAt !== b.pinnedAt) {
        return a.pinnedAt < b.pinnedAt ? 1 : -1;
      }
      return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
    })
    .slice(0, limit)
    .map(({ id, name }) => ({ id, name }));
}
