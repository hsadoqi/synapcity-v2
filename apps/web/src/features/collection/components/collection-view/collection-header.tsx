import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';
import { LinkButton } from '@synapcity/frontend-ui/components/link-button';

import type { CollectionLabels } from '../../shared';

type CollectionHeaderProps = {
  labels: CollectionLabels;
  /** Where the collection lives (e.g. a space name), shown above the title. */
  context?: string;
  count: number;
  loading: boolean;
  userId?: string;
};

export function CollectionHeader({
  labels: { plural, singular },
  context,
  count,
  loading,
  userId,
}: CollectionHeaderProps) {
  const countLabel = `${count} ${count === 1 ? singular : plural.toLowerCase()}`;
  // Without a signed-in user there is no route to link to.
  const viewAllHref = userId
    ? `/${userId}/home/${plural.toLowerCase()}`
    : undefined;

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <div className="flex min-w-0 flex-col gap-1">
        {context && (
          <p className="truncate text-sm text-muted-foreground">{context}</p>
        )}
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-foreground text-balance">
            {plural}
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
      {viewAllHref && (
        <LinkButton href={viewAllHref} variant="link" size="sm">
          View all {plural.toLowerCase()}
        </LinkButton>
      )}
    </header>
  );
}
