import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

const PLACEHOLDER_CARDS = 8;

/**
 * The spaces page while its spaces load: the real heading and intro, which do
 * not depend on the data, over card placeholders laid out as the grid lays out.
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
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Spaces
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Each space keeps related documents and dashboards in one place. The
          one you changed last comes first.
        </p>
      </header>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: PLACEHOLDER_CARDS }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
