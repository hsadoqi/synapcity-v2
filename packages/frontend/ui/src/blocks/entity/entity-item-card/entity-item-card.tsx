'use client';

import Link from 'next/link';
import type { EntityItem } from '@synapcity/frontend-ui/types/entity';
import { EntityIcon } from '@synapcity/frontend-ui/blocks/entity/entity-icon';
import { formatEntityDate } from '@synapcity/frontend-ui/blocks/entity/format-entity-date';
import { EntityMoreActions } from '@synapcity/frontend-ui/blocks/entity/entity-header';

interface EntityItemCardProps {
  entity: EntityItem;
  slug: string;
}

/**
 * The whole card opens the item: the title link stretches over it, and the
 * actions menu comes last in the DOM so it sits above that stretched area.
 */
export function EntityItemCard({ entity, slug }: EntityItemCardProps) {
  const updatedLabel = formatEntityDate(entity.updatedAt);

  return (
    <div className="group relative flex h-full flex-col gap-6 rounded-lg border border-border bg-card p-3 text-foreground transition-colors hover:bg-muted">
      <EntityIcon
        name={entity.icon}
        className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
        aria-hidden="true"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-sm font-medium">
          <Link
            href={`${slug}/${entity.id}`}
            className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
          >
            {entity.name}
          </Link>
        </h3>
        {entity.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground text-pretty">
            {entity.description}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="sr-only">Updated </span>
        <time dateTime={entity.updatedAt} suppressHydrationWarning>
          {updatedLabel}
        </time>
      </p>

      <div className="absolute top-2 right-2">
        <EntityMoreActions onRename={() => {}} onArchive={() => {}} />
      </div>
    </div>
  );
}
