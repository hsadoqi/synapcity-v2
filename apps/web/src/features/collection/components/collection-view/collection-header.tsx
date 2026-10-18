import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

import type { CollectionLabels } from '../../shared';

type CollectionHeaderProps = {
  labels: CollectionLabels;
  /** Where the collection lives (e.g. a space name), shown above the title. */
  context?: string;
  count: number;
  loading: boolean;
};

export function CollectionHeader({
  labels: { plural, singular },
  context,
  count,
  loading,
}: CollectionHeaderProps) {
  const countLabel = `${count} ${count === 1 ? singular : `${singular}s`}`;

  return (
    <header className="flex flex-col gap-1">
      {context && <p className="text-sm text-muted-foreground">{context}</p>}
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {plural}
        </h1>
        {loading ? (
          <Skeleton className="h-4 w-16" />
        ) : (
          <span className="text-sm text-muted-foreground tabular-nums">
            {countLabel}
          </span>
        )}
      </div>
    </header>
  );
}
