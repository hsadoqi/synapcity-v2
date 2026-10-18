'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Shapes } from 'lucide-react';

import { Alert, AlertDescription } from '@synapcity/frontend-ui/core/alert';

import { CollectionHighlights } from '@/features/collection/components/collection-displays';
import { CollectionView } from '@/features/collection/components/collection-view';
import {
  applyCollectionQuery,
  EMPTY_FILTERS,
  hasActiveFilters,
  tagsByUse,
  type CollectionFilters,
  type CollectionItem,
  type CollectionItemAction,
  type CollectionLayout,
  type CollectionSort,
} from '@/features/collection/shared';

import { toCollectionItem } from '../../lib/collection-item';
import { setSpacePinned } from '../../server/actions/space-state-actions';
import type { SpaceSummary } from '../../shared/types';
import { SpacePreview } from './space-preview';

interface SpacesIndexProps {
  spaces: SpaceSummary[];
  userId: string;
  /** The moment the page was rendered, so server and browser label dates alike. */
  now: string;
}

/** Spaces have no rename, duplicate or delete flow yet; offering them would be offering nothing. */
const SPACE_ACTIONS: CollectionItemAction[] = ['open', 'toggle-pin'];

const DEFAULT_SORT: CollectionSort = { field: 'updated', direction: 'desc' };

/**
 * The spaces index. The page loads every space once; search, filters, sort and
 * layout then run here, in the browser, so they answer at once (ADR-0011,
 * query ownership). Pinning shows at once and is saved in the background; if
 * the save fails the pin is put back and the person is told.
 */
export function SpacesIndex({ spaces, userId, now }: SpacesIndexProps) {
  const router = useRouter();
  const [items, setItems] = useState<CollectionItem[]>(() =>
    spaces.map((space) => toCollectionItem(space, userId)),
  );
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<CollectionFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<CollectionSort>(DEFAULT_SORT);
  const [layout, setLayout] = useState<CollectionLayout>('list');
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const nowDate = useMemo(() => new Date(now), [now]);
  const visible = useMemo(
    () => applyCollectionQuery(items, { query, filters, sort, now: nowDate }),
    [items, query, filters, sort, nowDate],
  );
  const tagOptions = useMemo(() => tagsByUse(items), [items]);
  const filtering = query.trim() !== '' || hasActiveFilters(filters);

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
      router.push(item.href);
    }
    if (action === 'toggle-pin') {
      const next = !item.pinned;
      setError(null);
      setPinned(item.id, next);
      startTransition(async () => {
        const result = await setSpacePinned(item.id, next);
        if (!result.ok) {
          setPinned(item.id, item.pinned);
          setError(result.error);
        }
      });
    }
  }

  const shared = {
    icon: Shapes,
    singular: 'space',
    actions: SPACE_ACTIONS,
    onItemAction: handleItemAction,
    renderPreview: (item: CollectionItem) => <SpacePreview item={item} />,
  };

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* While searching or filtering the page is about the results, not the highlights. */}
      {!filtering && (
        <CollectionHighlights
          id="spaces"
          recentHeading="Recently viewed"
          pinnedHeading="Pinned"
          pinnedEmptyMessage="Pin a space from its menu to keep it here."
          items={items}
          {...shared}
        />
      )}

      <CollectionView
        {...shared}
        hideTitle
        labels={{ singular: 'space', plural: 'Spaces' }}
        tagOptions={tagOptions}
        emptyState={{
          title: 'No spaces yet',
          description:
            'A space is a quiet room for one idea, project, or season. Start with whatever is on your mind today.',
        }}
        items={visible}
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
