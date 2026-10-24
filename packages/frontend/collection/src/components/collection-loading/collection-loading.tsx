'use client';

import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

import type { CollectionLayout } from '../../types';

const PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => index);

export function CollectionLoading({ layout }: { layout: CollectionLayout }) {
  return layout === 'list' ? <ListSkeleton /> : <GridSkeleton />;
}

function ListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex flex-col divide-y divide-border rounded-md border border-border bg-card"
    >
      {PLACEHOLDERS.map((index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="hidden h-4 flex-1 md:block" />
          <Skeleton className="hidden h-3 w-24 sm:block" />
        </div>
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      {PLACEHOLDERS.map((index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-md border border-border bg-card p-4"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="size-8 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
