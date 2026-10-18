'use client';

import Link from 'next/link';
import type { EntityItem } from '@synapcity/frontend-ui/types/entity';
import { EntityIcon } from '@synapcity/frontend-ui/blocks/entity/entity-icon';

interface EntityItemCardProps {
  entity: EntityItem;
  slug: string;
}

export function EntityItemCard({ entity, slug }: EntityItemCardProps) {
  const updatedLabel = new Date(entity.updatedAt).toLocaleDateString(
    undefined,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  );
  return (
    <Link
      href={`${slug}/${entity.id}`}
      className="group flex h-full flex-col gap-6 rounded-md border border-border bg-card p-4 text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <EntityIcon
        name={entity.icon}
        className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-sm font-medium">{entity.name}</h3>
        {entity.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground text-pretty">
            {entity.description}
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="sr-only">Updated </span>
        <time dateTime={entity.updatedAt}>{updatedLabel}</time>
      </p>
    </Link>
  );
}
