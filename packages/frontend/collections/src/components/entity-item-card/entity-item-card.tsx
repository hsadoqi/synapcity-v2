'use client';

import { useCollectionNavigation } from '../../providers';
import type { EntityItem } from '../../types';
import { EntityDate } from '../entity-date';
import { EntityIcon } from '../entity-icon';
import { EntityMoreActions } from '../entity-header';

interface EntityItemCardProps {
  entity: EntityItem;
  slug: string;
  /** Without either action the card has no actions menu. */
  onRename?: () => void;
  onArchive?: () => void;
}

/**
 * The whole card opens the item: the title link stretches over it, and the
 * actions menu comes last in the DOM so it sits above that stretched area.
 *
 * Renders on the server; only the date and the actions menu run in the browser.
 */
export function EntityItemCard({
  entity,
  slug,
  onRename,
  onArchive,
}: EntityItemCardProps) {
  const { Link } = useCollectionNavigation();
  const hasActions = Boolean(onRename || onArchive);

  return (
    <div className="group relative flex h-full flex-col gap-6 rounded-lg border border-border bg-card p-3 text-foreground transition-colors hover:bg-muted/50">
      <EntityIcon
        name={entity.icon}
        className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
        aria-hidden="true"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Two lines, so spaces whose names start alike stay tellable apart. */}
        <h3 className="line-clamp-2 text-sm font-medium wrap-break-word">
          <Link
            href={entity.href ?? `${slug}/${entity.id}`}
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

      <EntityDate
        at={entity.updatedAt}
        srPrefix="Updated"
        className="text-xs text-muted-foreground"
      />

      {hasActions && (
        <div className="absolute top-2 right-2">
          <EntityMoreActions onRename={onRename} onArchive={onArchive} />
        </div>
      )}
    </div>
  );
}
