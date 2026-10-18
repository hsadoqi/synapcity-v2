'use client';

import type { LucideIcon } from 'lucide-react';

import {
  EMPTY_FILTERS,
  hasActiveFilters,
  type CollectionEmptyCopy,
  type CollectionFilters,
  type CollectionGrouping,
  type CollectionItem,
  type CollectionItemAction,
  type CollectionLabels,
  type CollectionLayout,
  type CollectionSort,
  type CollectionState,
} from '../../shared';
import {
  CollectionEmpty,
  CollectionLoading,
  CollectionNoResults,
} from '../collection-states';
import { ActiveFilters, CollectionToolbar } from '../collection-toolbar';
import { CollectionGrid } from './collection-grid';
import { CollectionHeader } from './collection-header';
import { CollectionList } from './collection-list';

export type CollectionViewProps = {
  /** How to name the items: "document" / "Documents". */
  labels: CollectionLabels;
  /** Icon for each item and for the empty state. */
  icon: LucideIcon;
  /** Where the collection lives (e.g. a space name): shown above the title and in the search placeholder. */
  context?: string;
  /** Turns on the group filter and shows each item's group. Omit to hide both. */
  grouping?: CollectionGrouping;
  emptyState: CollectionEmptyCopy;
  items: CollectionItem[];
  state: CollectionState;
  query: string;
  onQueryChange: (query: string) => void;
  filters: CollectionFilters;
  onFiltersChange: (filters: CollectionFilters) => void;
  sort: CollectionSort;
  onSortChange: (sort: CollectionSort) => void;
  layout: CollectionLayout;
  onLayoutChange: (layout: CollectionLayout) => void;
  onCreate: () => void;
  onItemAction?: (action: CollectionItemAction, item: CollectionItem) => void;
  /** Whose home the toolbar's "View all" link goes to. Omit to hide the link. */
  userId?: string;
  now?: Date;
};

/**
 * The resource-specific part of a CollectionView: everything a consumer
 * supplies to name and describe its items. The rest is state and handlers.
 */
export type CollectionViewConfig = Pick<
  CollectionViewProps,
  'labels' | 'icon' | 'context' | 'grouping' | 'emptyState'
>;

export function CollectionView({
  labels,
  icon,
  context,
  grouping,
  emptyState,
  items,
  state,
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  layout,
  onLayoutChange,
  onCreate,
  onItemAction = () => {},
  userId,
  now = new Date(),
}: CollectionViewProps) {
  // Without a signed-in user there is no route to link to.
  const viewAllHref = userId
    ? `/${userId}/home/${labels.plural.toLowerCase()}`
    : undefined;

  const itemProps = {
    icon,
    singular: labels.singular,
    items,
    showGroup: grouping !== undefined,
    now,
    onItemAction,
  };

  return (
    <section className="flex flex-col gap-6">
      <CollectionHeader
        labels={labels}
        context={context}
        count={state === 'populated' ? items.length : 0}
        loading={state === 'loading'}
      />

      <div className="flex flex-col gap-3">
        <CollectionToolbar
          labels={labels}
          context={context}
          grouping={grouping}
          query={query}
          onQueryChange={onQueryChange}
          filters={filters}
          onFiltersChange={onFiltersChange}
          sort={sort}
          onSortChange={onSortChange}
          layout={layout}
          onLayoutChange={onLayoutChange}
          viewAllHref={viewAllHref}
        />
        <ActiveFilters filters={filters} onFiltersChange={onFiltersChange} />
      </div>

      {state === 'loading' && <CollectionLoading layout={layout} />}

      {state === 'empty' && (
        <CollectionEmpty
          icon={icon}
          singular={labels.singular}
          copy={emptyState}
          onCreate={onCreate}
        />
      )}

      {state === 'no-results' && (
        <CollectionNoResults
          plural={labels.plural}
          query={query}
          hasFilters={hasActiveFilters(filters)}
          onClearQuery={() => onQueryChange('')}
          onClearFilters={() => onFiltersChange(EMPTY_FILTERS)}
        />
      )}

      {state === 'populated' && layout === 'grid' && (
        <CollectionGrid {...itemProps} />
      )}

      {state === 'populated' && layout === 'list' && (
        <CollectionList {...itemProps} />
      )}
    </section>
  );
}
