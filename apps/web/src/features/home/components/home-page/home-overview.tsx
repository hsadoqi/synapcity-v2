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
      {/* <FeaturedItems
        {...OVERVIEW_SECTIONS.continue}
        items={items.slice(0, 3)}
        kinds={ITEM_KINDS}
        now={FIXTURE_NOW}
      /> */}
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
      <ItemChipsSkeleton
        heading={OVERVIEW_SECTIONS.pinned.heading}
        headingIcon={OVERVIEW_SECTIONS.pinned.headingIcon}
      />
      <CompactItemListSkeleton
        heading={OVERVIEW_SECTIONS.recent.heading}
        rows={6}
      />
    </>
  );
}
