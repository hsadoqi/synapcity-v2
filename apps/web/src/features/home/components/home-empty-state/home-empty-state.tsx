import type { CollectionItem } from '@synapcity/frontend-collection';

import { HomeEmptyRecent } from './home-empty-recent';
import { HomeEmptyRecentSkeleton } from './home-empty-recent-skeleton';
import { HomeEmptyStateIntro } from './home-empty-state-intro';

type HomeEmptyStateProps = {
  /** While loading, the recent line shows a skeleton. */
  loading?: boolean;
  /** Recent items, if any, shown as one line under the intro. */
  items?: CollectionItem[];
  /** What the button creates, e.g. "space". */
  singular?: string;
  onCreate: () => void;
};

/** Home before there is anything to show: a welcome and one way to start. */
export function HomeEmptyState({
  loading = false,
  items = [],
  singular,
  onCreate,
}: HomeEmptyStateProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-prose flex-col justify-center gap-8 px-4 pt-12 pb-24 sm:px-6">
      <HomeEmptyStateIntro onCreate={onCreate} singular={singular} />
      {loading ? (
        <HomeEmptyRecentSkeleton />
      ) : (
        <HomeEmptyRecent items={items} />
      )}
    </div>
  );
}
