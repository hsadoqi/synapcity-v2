'use client';

import Link from 'next/link';
import type { EntityItem } from '@synapcity/frontend-ui/types/entity';
import { EntityIcon } from '@synapcity/frontend-ui/blocks/entity/entity-icon';
import { formatEntityDate } from '@synapcity/frontend-ui/blocks/entity/format-entity-date';

export const RecentEntityRow = ({
  entity,
  slug,
}: {
  entity: EntityItem;
  slug: string;
}) => {
  const updatedLabel = formatEntityDate(entity.updatedAt);
  return (
    <li key={entity.id}>
      <Link
        href={slug}
        className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        <EntityIcon
          name={entity.icon}
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate">{entity.name}</span>
        <time
          dateTime={entity.updatedAt}
          className="shrink-0 text-xs text-muted-foreground"
        >
          {updatedLabel}
        </time>
      </Link>
    </li>
  );
};
