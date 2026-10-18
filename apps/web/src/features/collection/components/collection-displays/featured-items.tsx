import { ArrowRight } from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';
import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

import { cn } from '@/lib/utils';

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

/** The first item shown large with an Open button, then up to two smaller cards. */
export function FeaturedItems({
  id,
  heading,
  headingIcon,
  emptyMessage,
  items,
  ...itemProps
}: CollectionDisplayProps) {
  const [lead, ...rest] = items;
  const siblings = rest.slice(0, 2);

  return (
    <CollectionSection
      id={id}
      heading={heading}
      icon={headingIcon}
      emptyMessage={emptyMessage}
      isEmpty={!lead}
    >
      <div
        className={cn(
          'grid grid-cols-1 gap-3',
          siblings.length > 0 && 'lg:grid-cols-3',
        )}
      >
        {lead && (
          <FeaturedItemCard
            item={lead}
            className={cn(siblings.length > 0 && 'lg:col-span-2')}
            {...itemProps}
          />
        )}
        {siblings.length > 0 && (
          <ul className="flex flex-col gap-3">
            {siblings.map((item) => (
              <li key={item.id}>
                <FeaturedItemSibling item={item} {...itemProps} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </CollectionSection>
  );
}

/** The lead item, large, with an explicit Open button. */
function FeaturedItemCard({
  item,
  kinds,
  now,
  timeZone,
  onOpen,
  className,
}: CollectionDisplayItemProps & { className?: string }) {
  const kind = kindOf(item, kinds);
  return (
    <article
      className={cn(
        'flex flex-col gap-5 rounded-md border border-border bg-card p-5',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ItemKindTile kind={kind} size="md" />
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          {item.group}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          {kind.label}
        </p>
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-pretty">
        {item.title}
      </h3>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Edited{' '}
          <time dateTime={item.updatedAt}>
            {formatAgo(item.updatedAt, now, timeZone)}
          </time>
        </p>
        <Button onClick={() => onOpen?.(item)}>
          Open
          <span className="sr-only"> {item.title}</span>
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}

/** A smaller card for the items after the lead; the whole card opens it. */
function FeaturedItemSibling({
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
      className="flex w-full items-center gap-3 rounded-md border border-border bg-card p-4 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ItemKindTile kind={kindOf(item, kinds)} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{item.title}</span>
        <span className="truncate text-xs text-muted-foreground">
          {item.group}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, edited </span>
          <time dateTime={item.updatedAt}>
            {formatAgo(item.updatedAt, now, timeZone)}
          </time>
        </span>
      </span>
    </button>
  );
}

export function FeaturedItemsSkeleton({
  heading,
  headingIcon,
}: Pick<CollectionDisplayProps, 'heading' | 'headingIcon'>) {
  return (
    <CollectionSectionSkeleton heading={heading} icon={headingIcon}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="flex flex-col gap-5 rounded-md border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-sm" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-2/3" />
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {[0, 1].map((key) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-md border border-border bg-card p-4"
            >
              <Skeleton className="size-8 rounded-sm" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </CollectionSectionSkeleton>
  );
}
