import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

import { SpacesHeader } from './spaces-header';

const PLACEHOLDER_ROWS = 5;

/**
 * The spaces page while its spaces load: the real heading and intro, which do
 * not depend on the data, over placeholders laid out as the page lays out
 * (carousel beside the pinned panel, a toolbar, then the list).
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

      <div aria-hidden="true" className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-3">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="h-48 basis-11/12 shrink-0" />
            <Skeleton className="h-48 basis-56 shrink-0" />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-border p-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>

      <div aria-hidden="true" className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-7 flex-1 sm:max-w-sm" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="flex flex-col gap-1">
          {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
