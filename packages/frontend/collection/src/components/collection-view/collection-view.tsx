'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { EMPTY_FILTERS, hasActiveFilters } from '../../utils';
import type {
  CollectionEmptyCopy,
  CollectionFilters,
  CollectionGrouping,
  CollectionItem,
  CollectionItemAction,
  CollectionLabels,
  CollectionLayout,
  CollectionSort,
  CollectionState,
} from '../../types';
import { CollectionEmpty } from '../collection-empty';
import { CollectionLoading } from '../collection-loading';
import { CollectionNoResults } from '../collection-no-results';
import { ActiveFilters } from '../active-filters';
import { CollectionTagChips } from '../collection-tag-chips';
import { CollectionToolbar } from '../collection-toolbar';
import { CollectionGrid } from '../collection-grid';
import { CollectionHeader } from '../collection-header';
import { CollectionList } from '../collection-list';

/** How many tags get a chip; any others are in the filter menu. */
const TAG_CHIP_LIMIT = 8;

export type CollectionViewProps = {
  /** How to name the items: "document" / "Documents". */
  labels: CollectionLabels;
  /** Icon for each item and for the empty state. */
  icon: LucideIcon;
  /** Where the collection lives (e.g. a space name): shown above the title and in the search placeholder. */
  context?: string;
  /** Turns on the group filter and shows each item's group. Omit to hide both. */
  grouping?: CollectionGrouping;
  /**
   * Every tag in use, most used first. Turns on the tag filter: a short row of
   * chips under the toolbar and a Tags submenu in the filter menu.
   */
  tagOptions?: string[];
  /** Which actions the item menu offers. Omit for all of them. */
  actions?: CollectionItemAction[];
  /** Content for the card shown when an item's icon is hovered. Omit for none. */
  renderPreview?: (item: CollectionItem) => ReactNode;
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
  /** Without it the view offers no create button, since one that does nothing is worse than none. */
  onCreate?: () => void;
  /** The section title when it should not be the plural, e.g. "All spaces" under a page titled "Spaces". */
  heading?: string;
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
  'labels' | 'icon' | 'context' | 'grouping' | 'tagOptions' | 'emptyState'
>;

export function CollectionView({
  labels,
  icon,
  context,
  grouping,
  tagOptions,
  actions,
  renderPreview,
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
  heading,
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
    actions,
    renderPreview,
  };

  return (
    <section className="flex flex-col gap-6">
      <CollectionHeader
        labels={labels}
        context={context}
        count={state === 'populated' ? items.length : 0}
        loading={state === 'loading'}
        heading={heading}
      />

      <div className="flex flex-col gap-3">
        <CollectionToolbar
          labels={labels}
          context={context}
          grouping={grouping}
          tagOptions={tagOptions?.slice(TAG_CHIP_LIMIT)}
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
        {tagOptions && (
          <CollectionTagChips
            tags={tagOptions}
            limit={TAG_CHIP_LIMIT}
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        )}
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
