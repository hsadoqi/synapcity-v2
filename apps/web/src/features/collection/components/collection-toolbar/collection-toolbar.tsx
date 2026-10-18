'use client';

import type {
  CollectionFilters,
  CollectionGrouping,
  CollectionLabels,
  CollectionLayout,
  CollectionSort,
} from '../../shared';
import { CollectionSearch } from './collection-search';
import { CreateButton } from './create-button';
import { FiltersMenu } from './filters-menu';
import { LayoutToggleGroup } from './layout-toggle-group';
import { SortOptionsMenu } from './sort-options-menu';

type CollectionToolbarProps = {
  labels: CollectionLabels;
  /** Where the collection lives (e.g. a space name), used in the search placeholder. */
  context?: string;
  /** Turns on the group submenu in the filter menu. */
  grouping?: CollectionGrouping;
  query: string;
  onQueryChange: (query: string) => void;
  filters: CollectionFilters;
  onFiltersChange: (filters: CollectionFilters) => void;
  sort: CollectionSort;
  onSortChange: (sort: CollectionSort) => void;
  layout: CollectionLayout;
  onLayoutChange: (layout: CollectionLayout) => void;
  onCreate: () => void;
};

export function CollectionToolbar({
  labels: { singular },
  context,
  grouping,
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  layout,
  onLayoutChange,
  onCreate,
}: CollectionToolbarProps) {
  const placeholder = context
    ? `Search ${singular}s in ${context}…`
    : `Search ${singular}s…`;

  // Mobile: search + create share row one, controls wrap to row two.
  // sm and up: search, controls, create on a single row.
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CollectionSearch
        query={query}
        onQueryChange={onQueryChange}
        placeholder={placeholder}
        label={`Search ${singular}s`}
        className="order-1 min-w-0 flex-1 sm:max-w-sm"
      />

      <div className="order-3 flex w-full items-center gap-2 sm:order-2 sm:w-auto">
        <FiltersMenu
          filters={filters}
          onFiltersChange={onFiltersChange}
          grouping={grouping}
        />
        <SortOptionsMenu sort={sort} onSortChange={onSortChange} />
        <LayoutToggleGroup layout={layout} onLayoutChange={onLayoutChange} />
      </div>

      <CreateButton
        onCreate={onCreate}
        singular={singular}
        className="order-2 ml-auto sm:order-3"
      />
    </div>
  );
}
