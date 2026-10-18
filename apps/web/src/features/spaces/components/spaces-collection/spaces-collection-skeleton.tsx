import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

import { SpacesHeader } from './spaces-header';

const PLACEHOLDER_CARDS = 8;

/**
 * The spaces page while its spaces load: the real heading and intro, which do
 * not depend on the data, over placeholders laid out as the grid lays out.
 */
export function SpacesCollectionSkeleton() {
  return (
    <div
      aria-busy="true"
      className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 lg:py-12"
    >
      <span className="sr-only" role="status">
        Loading spaces
      </span>
      <SpacesHeader />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: PLACEHOLDER_CARDS }, (_, index) => (
            <SpaceCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * EntityItemCard's frame and line heights (icon, name, two-line description,
 * date), so the cards land where the placeholders were.
 */
function SpaceCardSkeleton() {
  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-3">
      <Skeleton className="size-4" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
