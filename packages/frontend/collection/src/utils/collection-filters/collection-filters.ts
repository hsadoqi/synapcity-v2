import type { CollectionFilters } from '../../types';

export const EMPTY_FILTERS: CollectionFilters = {
  pinned: false,
  recent: false,
  groups: [],
  tags: [],
};

export function hasActiveFilters(filters: CollectionFilters) {
  return (
    filters.pinned ||
    filters.recent ||
    filters.groups.length > 0 ||
    filters.tags.length > 0
  );
}

export function countActiveFilters(filters: CollectionFilters) {
  return (
    Number(filters.pinned) +
    Number(filters.recent) +
    filters.groups.length +
    filters.tags.length
  );
}
