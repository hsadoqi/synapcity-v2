'use client';

import { Badge } from '@synapcity/frontend-ui/core/badge';

import { formatUpdated } from '../../utils';
import { ItemActionsMenu } from '../item-actions-menu';
import { ItemIconPreview } from '../item-icon-preview';
import { ItemOpenButton } from '../item-open-button';
import type { CollectionItemCardProps } from '../../types';
import { PinnedMark } from '../pinned-mark';

export function CollectionListRow({
  item,
  icon,
  singular,
  showGroup,
  now,
  onItemAction,
  actions,
  renderPreview,
}: CollectionItemCardProps) {
  return (
    <li className="relative flex items-center gap-3 px-3 py-2 transition-colors motion-reduce:transition-none first:rounded-t-md last:rounded-b-md hover:bg-muted/50">
      <ItemIconPreview item={item} icon={icon} renderPreview={renderPreview} />
      <div className="flex min-w-0 flex-1 items-baseline gap-3">
        <ItemOpenButton
          title={item.title}
          href={item.href}
          onOpen={() => onItemAction('open', item)}
        />
        {item.subtitle && (
          <p className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground md:block">
            {item.subtitle}
          </p>
        )}
      </div>
      {showGroup && item.group && (
        <span className="hidden w-32 truncate text-xs text-muted-foreground lg:block">
          {item.group}
        </span>
      )}
      {item.detail && (
        <span className="hidden w-40 shrink-0 truncate text-xs text-muted-foreground lg:block">
          {item.detail}
        </span>
      )}
      <div className="hidden w-40 items-center gap-1 overflow-hidden xl:flex">
        {item.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="ghost">
            {tag}
          </Badge>
        ))}
      </div>
      <span className="hidden w-44 shrink-0 truncate text-right text-xs text-muted-foreground sm:block">
        {formatUpdated(item.updatedAt, now)}
      </span>
      <span className="flex size-4 shrink-0 items-center justify-center">
        {item.pinned && <PinnedMark />}
      </span>
      <ItemActionsMenu
        item={item}
        singular={singular}
        onAction={onItemAction}
        actions={actions}
      />
    </li>
  );
}
