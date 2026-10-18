import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

import type { CollectionLabels } from '../../shared';
import { LinkButton } from '@synapcity/frontend-ui/components/link-button';

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
  userId
}: CollectionHeaderProps) {
  const countLabel = `${count} ${count === 1 ? singular : `${singular}s`}`;
  
const slug = `/${userId}/home/${plural.toLowerCase()}`;
  return (
    <header className="flex gap-1 justify-between items-center">
      {context && <p className="text-sm text-muted-foreground">{context}</p>}
      <div className="flex items-baseline gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
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
          <LinkButton
            href={slug}
            variant="link"
            size="sm"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View all {plural.toLowerCase()}
          </LinkButton>
    </header>
  );
}
