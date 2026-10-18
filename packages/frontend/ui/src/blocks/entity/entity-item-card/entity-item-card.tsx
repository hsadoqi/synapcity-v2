'use client';

import Link from 'next/link';
import type { EntityItem } from '@synapcity/frontend-ui/types/entity';
import { EntityIcon } from '@synapcity/frontend-ui/blocks/entity/entity-icon';
import { formatEntityDate } from '@synapcity/frontend-ui/blocks/entity/format-entity-date';
import { EntityMoreActions } from '../entity-header';

interface EntityItemCardProps {
  entity: EntityItem;
  slug: string;
}

export function EntityItemCard({ entity, slug }: EntityItemCardProps) {
  const updatedLabel = formatEntityDate(entity.updatedAt);
  return (
    <div  className="group flex h-full flex-col gap-6 rounded-lg border border-border bg-card p-3 text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring flex-1 justify-between">
      <div className="flex min-w-0 justify-between items-center">
      <EntityIcon
        name={entity.icon}
        className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
        aria-hidden="true"
      />
        <EntityMoreActions onRename={() => {}} onArchive={() => {}} />
        </div>
          <Link
            href={`${slug}/${entity.id}`}
          >
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-1 justify-content-start">
        <h3 className="truncate text-sm font-medium">{entity.name}</h3>
        {entity.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground text-pretty">
            {entity.description}
          </p>
        )}
      </div>
    </Link>
      <p className="text-xs text-muted-foreground">
        <span className="sr-only">Updated </span>
        <time dateTime={entity.updatedAt} suppressHydrationWarning>
          {updatedLabel}
        </time>
      </p>
      </div>
  );
}
