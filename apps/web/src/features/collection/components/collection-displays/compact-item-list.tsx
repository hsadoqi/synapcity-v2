import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

import { formatAgo } from '../../shared';
import {
  CollectionSection,
  CollectionSectionSkeleton,
} from './collection-section';
import type {
  CollectionDisplayItemProps,
  CollectionDisplayProps,
} from './display-props';
import { ItemKindTile, kindOf } from './item-kind';

type CompactItemListProps = CollectionDisplayProps & {
  /** Show at most this many items. */
  limit?: number;
};

/** A dense list: kind, title, group and how long ago, one row per item. */
export function CompactItemList({
  id,
  heading,
  headingIcon,
  emptyMessage,
  items,
  limit = 6,
  ...itemProps
}: CompactItemListProps) {
  const visible = items.slice(0, limit);

  return (
    <CollectionSection
      id={id}
      heading={heading}
      icon={headingIcon}
      emptyMessage={emptyMessage}
      isEmpty={visible.length === 0}
      tight
    >
      <ul className="-mx-2 flex flex-col flex-1">
        {visible.map((item) => (
          <li key={item.id}>
            <CompactItemRow item={item} {...itemProps} />
          </li>
        ))}
      </ul>
    </CollectionSection>
  );
}

function CompactItemRow({
  item,
  kinds,
  now,
  timeZone,
  onOpen,
}: CollectionDisplayItemProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ItemKindTile kind={kindOf(item, kinds)} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{item.title}</span>
        {item.group && (
          <span className="truncate text-xs text-muted-foreground">
            {item.group}
          </span>
        )}
      </span>
      <span className="sr-only">, edited </span>
      <time
        dateTime={item.updatedAt}
        className="shrink-0 text-xs text-muted-foreground tabular-nums"
      >
        {formatAgo(item.updatedAt, now, timeZone)}
      </time>
    </button>
  );
}

export function CompactItemListSkeleton({
  heading,
  headingIcon,
  rows = 6,
}: Pick<CollectionDisplayProps, 'heading' | 'headingIcon'> & {
  rows?: number;
}) {
  return (
    <CollectionSectionSkeleton heading={heading} icon={headingIcon} tight>
      <div className="flex flex-col">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3 py-2">
            <Skeleton className="size-8 rounded-sm" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </CollectionSectionSkeleton>
  );
}
