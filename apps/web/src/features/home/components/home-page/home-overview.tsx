import { Separator } from '@synapcity/frontend-ui/core/separator';
import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

import {
  CompactItemList,
  CompactItemListSkeleton,
  FeaturedItemsSkeleton,
  ItemChips,
  ItemChipsSkeleton,
} from '@/features/collection/components';

import { FIXTURE_NOW } from '../../lib/fixture-clock';
import { ITEM_KINDS, OVERVIEW_SECTIONS } from '../../lib/overview';
import type { HomePageProps } from '../../lib/types';

/** Home's overview: the shared collection displays, with home's words and items. */
export function HomeOverview({
  items = [],
  pinned = [],
}: Pick<HomePageProps, 'items' | 'pinned'>) {
  return (
    <div className="flex-1 flex flex-col gap-10">
      <ItemChips
        {...OVERVIEW_SECTIONS.pinned}
        items={pinned}
        kinds={ITEM_KINDS}
      />
      <CompactItemList
        {...OVERVIEW_SECTIONS.recent}
        items={items}
        limit={6}
        kinds={ITEM_KINDS}
        now={FIXTURE_NOW}
      />
    </div>
  );
}

/** The overview while it loads: each section's skeleton under its real heading. */
export function HomeOverviewSkeleton() {
  return (
    <>
      <FeaturedItemsSkeleton heading={OVERVIEW_SECTIONS.continue.heading} />
      {/* The tab bar and the overview under it, as CollectionTabs lays them out. */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-7 w-72" />
        </div>
        <Separator />
        <div className="flex flex-col gap-10">
          <ItemChipsSkeleton
            heading={OVERVIEW_SECTIONS.pinned.heading}
            headingIcon={OVERVIEW_SECTIONS.pinned.headingIcon}
          />
          <CompactItemListSkeleton
            heading={OVERVIEW_SECTIONS.recent.heading}
            rows={6}
          />
        </div>
      </div>
    </>
  );
}
