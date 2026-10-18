'use client';

import { useState } from 'react';

import { Separator } from '@synapcity/frontend-ui/core/separator';

import {
  applyCollectionQuery,
  applyItemAction,
  EMPTY_FILTERS,
  hasActiveFilters,
  type CollectionFilters,
  type CollectionItem,
  type CollectionItemAction,
  type CollectionLayout,
  type CollectionSort,
  type CollectionState,
} from '../../shared';
import { CollectionView, type CollectionViewConfig } from '../collection-view';
import { CollectionTabsBar, OVERVIEW_TAB } from './collection-tabs-bar';

/** One collection tab: its label, how to describe its items, and the items. */
export type CollectionTabDefinition = {
  /** Unique among the tabs, and not `'overview'`. */
  id: string;
  label: string;
  view: CollectionViewConfig;
  /** Already narrowed to wherever this tab is shown, by whoever loaded them. */
  items: CollectionItem[];
};

type CollectionTabsProps = {
  /** The collection tabs, in order. The first is selected unless there is an overview. */
  tabs: CollectionTabDefinition[];
  /**
   * Content for an optional overview tab, shown first and selected by default.
   * Omit it and only the collection tabs show.
   */
  children?: React.ReactNode;
  overviewLabel?: string;
  /** The time relative dates are measured from. Defaults to now. */
  now?: Date;
};

/**
 * Collections as tabs, with an optional overview first. The caller decides the
 * tabs, how each describes its items, and the items, so each page can set it
 * up differently. With a single tab the tab bar is hidden.
 */
export function CollectionTabs({
  tabs,
  children,
  overviewLabel = 'Overview',
  now,
}: CollectionTabsProps) {
  const hasOverview = children != null;
  const [showingOverview, setShowingOverview] = useState(hasOverview);
  // Kept while the overview is showing, so returning restores the last tab.
  const [activeId, setActiveId] = useState<string | undefined>(tabs[0]?.id);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<CollectionFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<CollectionSort>({
    field: 'updated',
    direction: 'desc',
  });
  const [layout, setLayout] = useState<CollectionLayout>('grid');
  // Fixture stage: item actions edit a local copy, seeded once from the tabs.
  // With real data they go to the owning resource feature instead.
  const [itemsById, setItemsById] = useState<Record<string, CollectionItem[]>>(
    () => Object.fromEntries(tabs.map(({ id, items }) => [id, items])),
  );

  const active = tabs.find(({ id }) => id === activeId);
  // No useMemo: the React Compiler memoizes this, and a manual one blocks it.
  const visibleItems = active
    ? applyCollectionQuery(itemsById[active.id] ?? [], {
        query,
        filters,
        sort,
        now: now ?? new Date(),
      })
    : [];

  const isNarrowed = query.trim().length > 0 || hasActiveFilters(filters);
  const viewState: CollectionState =
    visibleItems.length > 0 ? 'populated' : isNarrowed ? 'no-results' : 'empty';

  const tab = hasOverview && showingOverview ? OVERVIEW_TAB : activeId;
  const tabCount = tabs.length + (hasOverview ? 1 : 0);

  function handleTabChange(next: string) {
    if (next === OVERVIEW_TAB) {
      setShowingOverview(true);
      return;
    }
    setShowingOverview(false);
    if (next !== activeId) {
      setActiveId(next);
      setFilters(EMPTY_FILTERS);
    }
  }

  function handleItemAction(
    action: CollectionItemAction,
    item: CollectionItem,
  ) {
    if (!active) return;
    const id = active.id;
    setItemsById((current) => {
      const list = current[id] ?? [];
      const next = applyItemAction(list, action, item, now ?? new Date());
      return next === list ? current : { ...current, [id]: next };
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {tab && tabCount > 1 && (
        <>
          <CollectionTabsBar
            tab={tab}
            onTabChange={handleTabChange}
            overviewLabel={hasOverview ? overviewLabel : undefined}
            tabs={tabs}
          />
          <Separator />
        </>
      )}

      {tab === OVERVIEW_TAB
        ? children
        : active && (
            <CollectionView
              {...active.view}
              items={visibleItems}
              state={viewState}
              query={query}
              onQueryChange={setQuery}
              filters={filters}
              onFiltersChange={setFilters}
              sort={sort}
              onSortChange={setSort}
              layout={layout}
              onLayoutChange={setLayout}
              onCreate={() => {}}
              onItemAction={handleItemAction}
              now={now}
            />
          )}
    </div>
  );
}
