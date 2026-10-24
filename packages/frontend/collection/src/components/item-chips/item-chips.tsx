import { Button } from '@synapcity/frontend-ui/core/button';
import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

import {
  CollectionSection,
  CollectionSectionSkeleton,
} from '../collection-section';
import type { CollectionDisplayProps } from '../../types';
import { ItemKindIcon, kindOf } from '../item-kind';

/** Items as a wrapping row of outline buttons: quick to scan, one click to open. */
export function ItemChips({
  id,
  heading,
  headingIcon,
  emptyMessage,
  items,
  kinds,
  onOpen,
}: Omit<CollectionDisplayProps, 'now' | 'timeZone'>) {
  return (
    <CollectionSection
      id={id}
      heading={heading}
      icon={headingIcon}
      emptyMessage={emptyMessage}
      isEmpty={items.length === 0}
    >
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.id} className="max-w-full">
            <Button
              variant="outline"
              className="max-w-full"
              onClick={() => onOpen?.(item)}
            >
              <ItemKindIcon kind={kindOf(item, kinds)} />
              <span className="truncate">{item.title}</span>
            </Button>
          </li>
        ))}
      </ul>
    </CollectionSection>
  );
}

export function ItemChipsSkeleton({
  heading,
  headingIcon,
}: Pick<CollectionDisplayProps, 'heading' | 'headingIcon'>) {
  return (
    <CollectionSectionSkeleton heading={heading} icon={headingIcon}>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-24" />
      </div>
    </CollectionSectionSkeleton>
  );
}
