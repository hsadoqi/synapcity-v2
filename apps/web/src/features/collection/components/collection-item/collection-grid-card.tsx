'use client';

import { Badge } from '@synapcity/frontend-ui/core/badge';

import { formatUpdated } from '../../shared';
import { ItemActionsMenu } from './item-actions-menu';
import { ItemIconPreview } from './item-icon-preview';
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
  actions,
  renderPreview,
}: CollectionItemCardProps) {
  return (
    <li className="relative flex flex-col gap-3 rounded-md border border-border bg-card p-4 text-card-foreground transition-colors hover:bg-muted/50 motion-reduce:transition-none">
      <div className="flex items-start gap-3">
        <ItemIconPreview
          item={item}
          icon={icon}
          renderPreview={renderPreview}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <ItemOpenButton
              title={item.title}
              href={item.href}
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
          actions={actions}
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
        {item.detail && (
          <>
            <span aria-hidden="true">·</span>
            <span className="truncate">{item.detail}</span>
          </>
        )}
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
