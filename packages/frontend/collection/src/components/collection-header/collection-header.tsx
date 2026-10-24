import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

import type { CollectionLabels } from '../../types';

type CollectionHeaderProps = {
  labels: CollectionLabels;
  /** Where the collection lives (e.g. a space name), shown above the title. */
  context?: string;
  count: number;
  loading: boolean;
  /** Replaces the plural as the section title, for a page that has its own heading above. */
  heading?: string;
};

export function CollectionHeader({
  labels: { plural, singular },
  context,
  count,
  loading,
  heading,
}: CollectionHeaderProps) {
  const countLabel = `${count} ${count === 1 ? singular : plural.toLowerCase()}`;
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <div className="flex min-w-0 flex-col gap-1">
        {context && (
          <p className="truncate text-sm text-muted-foreground">{context}</p>
        )}
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-foreground text-balance">
            {heading ?? plural}
          </h2>
          {loading ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <span className="text-sm text-muted-foreground tabular-nums">
              {countLabel}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
