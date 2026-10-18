'use client';

import { useMemo } from 'react';

import { byRecency } from '../../shared';
import type { CollectionItemsProps } from '../collection-item/item-props';
import { PinnedPanel } from './pinned-panel';
import { RecentCarousel } from './recent-carousel';

type CollectionHighlightsProps = Omit<
  CollectionItemsProps,
  'now' | 'showGroup'
> & {
  /** Prefix for the two headings' ids. Unique on the page. */
  id: string;
  recentHeading: string;
  pinnedHeading: string;
  pinnedEmptyMessage: React.ReactNode;
};

/**
 * The top of an index page: what was in use most recently, as a carousel,
 * beside what is pinned. Give it every item; it orders and splits them.
 */
export function CollectionHighlights({
  id,
  recentHeading,
  pinnedHeading,
  pinnedEmptyMessage,
  items,
  ...itemProps
}: CollectionHighlightsProps) {
  const ordered = useMemo(() => byRecency(items), [items]);
  const pinned = useMemo(
    () => ordered.filter((item) => item.pinned),
    [ordered],
  );

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <div className="min-w-0 lg:col-span-3">
        <RecentCarousel
          id={`${id}-recent`}
          heading={recentHeading}
          items={ordered}
          {...itemProps}
        />
      </div>
      <PinnedPanel
        id={`${id}-pinned`}
        heading={pinnedHeading}
        emptyMessage={pinnedEmptyMessage}
        items={pinned}
        {...itemProps}
      />
    </div>
  );
}
