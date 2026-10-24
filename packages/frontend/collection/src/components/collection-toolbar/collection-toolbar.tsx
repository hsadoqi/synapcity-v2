'use client';

import type {
  CollectionFilters,
  CollectionGrouping,
  CollectionLabels,
  CollectionLayout,
  CollectionSort,
} from '../../types';
import { buttonVariants } from '@synapcity/frontend-ui/core/button';
import { cn } from '@synapcity/frontend-ui/lib/utils';

import { useCollectionNavigation } from '../../providers';

import { CollectionSearch } from '../collection-search';
import { FiltersMenu } from '../filters-menu';
import { LayoutToggleGroup } from '../layout-toggle-group';
import { SortOptionsMenu } from '../sort-options-menu';

type CollectionToolbarProps = {
  labels: CollectionLabels;
  /** Where the collection lives (e.g. a space name), used in the search placeholder. */
  context?: string;
  /** Turns on the group submenu in the filter menu. */
  grouping?: CollectionGrouping;
  /** Every tag in use, for the tag submenu of the filter menu. */
  tagOptions?: string[];
  query: string;
  onQueryChange: (query: string) => void;
  filters: CollectionFilters;
  onFiltersChange: (filters: CollectionFilters) => void;
  sort: CollectionSort;
  onSortChange: (sort: CollectionSort) => void;
  layout: CollectionLayout;
  onLayoutChange: (layout: CollectionLayout) => void;
  /** Where "View all" goes. Omit to hide the link. */
  viewAllHref?: string;
};

export function CollectionToolbar({
  labels: { plural },
  context,
  grouping,
  tagOptions,
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  layout,
  onLayoutChange,
  viewAllHref,
}: CollectionToolbarProps) {
  const { Link } = useCollectionNavigation();
  const placeholder = context
    ? `Search ${plural.toLowerCase()} in ${context}…`
    : `Search ${plural.toLowerCase()}…`;

  // Mobile: search + "View all" share row one, controls wrap to row two.
  // sm and up: search, controls, "View all" on a single row.
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CollectionSearch
        query={query}
        onQueryChange={onQueryChange}
        placeholder={placeholder}
        label={`Search ${plural.toLowerCase()}`}
        className="order-1 min-w-0 flex-1 sm:max-w-sm"
      />

      <div className="order-3 flex w-full items-center gap-2 sm:order-2 sm:w-auto">
        <FiltersMenu
          filters={filters}
          onFiltersChange={onFiltersChange}
          grouping={grouping}
          tags={tagOptions}
        />
        <SortOptionsMenu sort={sort} onSortChange={onSortChange} />
        <LayoutToggleGroup layout={layout} onLayoutChange={onLayoutChange} />
      </div>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          data-slot="link-button"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'order-2 ml-auto sm:order-3',
          )}
        >
          View all {plural.toLowerCase()}
        </Link>
      )}
    </div>
  );
}
