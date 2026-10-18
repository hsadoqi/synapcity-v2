'use client';

import { Badge } from '@synapcity/frontend-ui/core/badge';

import { formatUpdated } from '../../shared';
import { ItemActionsMenu } from './item-actions-menu';
import { ItemIcon } from './item-icon';
import { ItemOpenButton } from './item-open-button';
import type { CollectionItemCardProps } from './item-props';
import { PinnedMark } from './pinned-mark';

export function CollectionGridCard({
  item,
  icon,
  singular,
  showGroup,
  now,
  onItemAction,
}: CollectionItemCardProps) {
  return (
    <li className="relative flex flex-col gap-3 rounded-md border border-border bg-card p-4 text-card-foreground transition-colors hover:bg-muted motion-reduce:transition-none">
      <div className="flex items-start gap-3">
        <ItemIcon icon={icon} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <ItemOpenButton
              title={item.title}
              onOpen={() => onItemAction('open', item)}
            />
            {item.pinned && <PinnedMark />}
          </div>
          {item.subtitle && (
            <p className="line-clamp-2 text-sm text-muted-foreground text-pretty">
              {item.subtitle}
            </p>
          )}
        </div>
        <ItemActionsMenu
          item={item}
          singular={singular}
          onAction={onItemAction}
        />
      </div>

      {item.tags.length > 0 && (
        <ul role="list" aria-label="Tags" className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary">{tag}</Badge>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-auto flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        <span className="shrink-0">{formatUpdated(item.updatedAt, now)}</span>
        {showGroup && item.group && (
          <>
            <span aria-hidden="true">·</span>
            <span className="truncate">{item.group}</span>
          </>
        )}
      </p>
    </li>
  );
}
