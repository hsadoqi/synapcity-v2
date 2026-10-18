import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

export function HomeEmptyRecentSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col items-center gap-2">
      <span className="sr-only" role="status">
        Loading recent
      </span>
      <Skeleton className="h-4 w-16" />
      <div className="flex gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
