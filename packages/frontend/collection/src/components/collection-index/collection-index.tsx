'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { Alert, AlertDescription } from '@synapcity/frontend-ui/core/alert';
import { buttonVariants } from '@synapcity/frontend-ui/core/button';

import { useCollectionNavigation } from '../../providers';
import {
  applyCollectionQuery,
  EMPTY_FILTERS,
  hasActiveFilters,
  pinnedFirst,
  tagsByUse,
} from '../../utils';
import type {
  CollectionEmptyCopy,
  CollectionFilters,
  CollectionItem,
  CollectionItemAction,
  CollectionLabels,
  CollectionLayout,
  CollectionSort,
} from '../../types';
import { CollectionHighlights } from '../collection-highlights';
import { CollectionView } from '../collection-view';

/** What saving a pin change reports back. */
export type SetPinnedResult =
  { ok: true } | { ok: false; error: string; signedOut?: boolean };

export type CollectionIndexProps = {
  /** Every item the owner has, in any order. */
  items: CollectionItem[];
  /** The moment the page was rendered, so server and browser label dates alike. */
  now: string;
  labels: CollectionLabels;
  icon: LucideIcon;
  /** The list's title, when the page already has its own heading above, e.g. "All spaces". */
  heading: string;
  recentHeading: string;
  pinnedHeading: string;
  pinnedEmptyMessage: ReactNode;
  emptyState: CollectionEmptyCopy;
  /** Which item actions the menu offers. */
  actions: CollectionItemAction[];
  /** Content for the card shown when an item's icon is hovered. */
  renderPreview?: (item: CollectionItem) => ReactNode;
  /** Saves a pin change. The index shows it at once and puts it back on failure. */
  onSetPinned: (id: string, pinned: boolean) => Promise<SetPinnedResult>;
  /**
   * Where to sign in again, when a save fails because the session ended. The
   * host builds it so the person comes back to this page; without it the
   * index shows only the message.
   */
  signInHref?: string;
  /**
   * The carousel and pinned panel appear only with more items than this. With
   * fewer they would just repeat the list, so pinned items lead the list.
   */
  highlightsFrom?: number;
};

/** The newest first, by when each item was last opened or changed. */
const DEFAULT_SORT: CollectionSort = { field: 'used', direction: 'desc' };

/**
 * An index page for one kind of item. The page loads every item once; search,
 * filters, sort and layout then run here, in the browser, so they answer at
 * once (ADR-0011, query ownership). Pinning shows at once and is saved in the
 * background; if the save fails the pin is put back and the person is told.
 */
export function CollectionIndex({
  items: initialItems,
  now,
  labels,
  icon,
  heading,
  recentHeading,
  pinnedHeading,
  pinnedEmptyMessage,
  emptyState,
  actions,
  renderPreview,
  onSetPinned,
  highlightsFrom = 6,
  signInHref,
}: CollectionIndexProps) {
  const { Link, push } = useCollectionNavigation();
  const [items, setItems] = useState<CollectionItem[]>(initialItems);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<CollectionFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<CollectionSort>(DEFAULT_SORT);
  const [layout, setLayout] = useState<CollectionLayout>('list');
  const [error, setError] = useState<{
    message: string;
    signedOut: boolean;
  } | null>(null);
  const [, startTransition] = useTransition();

  const nowDate = useMemo(() => new Date(now), [now]);
  const visible = useMemo(
    () => applyCollectionQuery(items, { query, filters, sort, now: nowDate }),
    [items, query, filters, sort, nowDate],
  );
  const tagOptions = useMemo(() => tagsByUse(items), [items]);
  const filtering = query.trim() !== '' || hasActiveFilters(filters);
  // While searching or filtering the page is about the results, not the highlights.
  const showHighlights = !filtering && items.length > highlightsFrom;
  const listed = useMemo(
    () => (showHighlights ? visible : pinnedFirst(visible)),
    [showHighlights, visible],
  );

  function setPinned(id: string, pinned: boolean) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, pinned } : item)),
    );
  }

  function handleItemAction(
    action: CollectionItemAction,
    item: CollectionItem,
  ) {
    if (action === 'open' && item.href) {
      push(item.href);
    }
    if (action === 'toggle-pin') {
      const next = !item.pinned;
      setError(null);
      setPinned(item.id, next);
      startTransition(async () => {
        const result = await onSetPinned(item.id, next);
        if (!result.ok) {
          setPinned(item.id, item.pinned);
          setError({
            message: result.error,
            signedOut: result.signedOut === true,
          });
        }
      });
    }
  }

  const shared = {
    icon,
    singular: labels.singular,
    actions,
    onItemAction: handleItemAction,
    renderPreview,
  };

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error.message}
            {error.signedOut && signInHref && (
              <Link
                href={signInHref}
                className={buttonVariants({ variant: 'link', size: 'sm' })}
              >
                Sign in again
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}

      {showHighlights && (
        <CollectionHighlights
          id={labels.plural.toLowerCase()}
          recentHeading={recentHeading}
          pinnedHeading={pinnedHeading}
          pinnedEmptyMessage={pinnedEmptyMessage}
          items={items}
          {...shared}
        />
      )}

      <CollectionView
        {...shared}
        heading={heading}
        labels={labels}
        tagOptions={tagOptions}
        emptyState={emptyState}
        items={listed}
        state={
          items.length === 0
            ? 'empty'
            : visible.length === 0
              ? 'no-results'
              : 'populated'
        }
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        layout={layout}
        onLayoutChange={setLayout}
        now={nowDate}
      />
    </div>
  );
}
