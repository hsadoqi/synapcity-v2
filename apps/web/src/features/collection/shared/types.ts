/**
 * Collection: the browse mechanics for any list of items — search, filters,
 * sort, layout and the display states. It knows nothing about which resource
 * it shows; the consumer passes labels, an icon, copy and grouping in.
 */

export type CollectionItem = {
  id: string;
  title: string;
  subtitle?: string;
  updatedAt: string;
  createdAt?: string;
  /** The group the item belongs to (a space, for example). Searchable and filterable. */
  group?: string;
  /**
   * What sort of thing the item is (e.g. 'document'), for lists that mix
   * kinds. The consumer maps it to an icon and a label.
   */
  kind?: string;
  tags: string[];
  pinned: boolean;
};

export type CollectionFilters = {
  pinned: boolean;
  recent: boolean;
  /** Selected group names; empty means every group. */
  groups: string[];
};

export type CollectionSortField = 'updated' | 'created' | 'title';
type CollectionSortDirection = 'asc' | 'desc';

export type CollectionSort = {
  field: CollectionSortField;
  direction: CollectionSortDirection;
};

export type CollectionLayout = 'grid' | 'list';

export type CollectionState = 'populated' | 'loading' | 'empty' | 'no-results';

export type CollectionItemAction =
  'open' | 'rename' | 'toggle-pin' | 'duplicate' | 'delete';

/** How the consumer names its items: "document" / "Documents". */
export type CollectionLabels = { singular: string; plural: string };

/**
 * Turns on grouping: a filter submenu named `label` listing `options`, and
 * each item's group shown on its card or row.
 */
export type CollectionGrouping = { label: string; options: string[] };

export type CollectionEmptyCopy = { title: string; description: string };

export const EMPTY_FILTERS: CollectionFilters = {
  pinned: false,
  recent: false,
  groups: [],
};

export function hasActiveFilters(filters: CollectionFilters) {
  return filters.pinned || filters.recent || filters.groups.length > 0;
}

export function countActiveFilters(filters: CollectionFilters) {
  return (
    Number(filters.pinned) + Number(filters.recent) + filters.groups.length
  );
}
