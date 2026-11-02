import { LoadingRegion } from '@synapcity/frontend-blocks';
import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

/** The canvas's shape while its saved state is read. */
export function DashboardWorkspaceSkeleton() {
  return (
    <LoadingRegion
      label="Loading dashboard…"
      className="min-h-96 flex-1 gap-4 p-5"
    >
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid flex-1 grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="col-span-2 h-40" />
        <Skeleton className="h-40" />
      </div>
    </LoadingRegion>
  );
}
