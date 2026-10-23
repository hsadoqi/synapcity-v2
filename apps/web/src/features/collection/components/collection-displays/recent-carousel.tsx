'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { EntityDate } from '@synapcity/frontend-ui/blocks/entity/entity-date';
import { Button } from '@synapcity/frontend-ui/core/button';
import { SectionHeading } from '@synapcity/frontend-ui/components/section-heading';

import { cn } from '@/lib/utils';

import type { CollectionItem } from '../../shared';
import { ItemActionsMenu } from '../collection-item/item-actions-menu';
import { ItemIconPreview } from '../collection-item/item-icon-preview';
import { ItemOpenButton } from '../collection-item/item-open-button';
import { PinnedMark } from '../collection-item/pinned-mark';
import type { CollectionItemsProps } from '../collection-item/item-props';

type RecentCarouselProps = Omit<CollectionItemsProps, 'now' | 'showGroup'> & {
  /** The heading's id. Unique on the page. */
  id: string;
  heading: string;
};

/** How big card `index` is: the first fills the row, the next two are medium, the rest compact. */
function sizeOf(index: number, count: number) {
  if (index === 0) return count === 1 ? 'lead-only' : 'lead';
  return index < 3 ? 'medium' : 'compact';
}

const SIZE_CLASSES = {
  'lead-only': 'basis-full',
  lead: 'basis-11/12',
  medium: 'basis-56',
  compact: 'basis-40',
} as const;

/**
 * The items in the order the owner last used them, as a row that scrolls
 * sideways. The first fills the row; the ones after it step down in size, so
 * how recent something is reads without a label. Pass the items already in
 * order. The next card's edge stays visible to show there is more.
 */
export function RecentCarousel({
  id,
  heading,
  items,
  icon,
  singular,
  onItemAction,
  actions,
  renderPreview,
}: RecentCarouselProps) {
  const track = useRef<HTMLUListElement>(null);

  function scrollBy(direction: -1 | 1) {
    const el = track.current;
    if (!el) return;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: reduced ? 'auto' : 'smooth',
    });
  }

  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <SectionHeading id={id}>{heading}</SectionHeading>
        {items.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Scroll ${heading.toLowerCase()} back`}
              onClick={() => scrollBy(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Scroll ${heading.toLowerCase()} forward`}
              onClick={() => scrollBy(1)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      {/* A scrollable region is reachable by keyboard, so it can be scrolled without a mouse. */}
      <ul
        ref={track}
        role="list"
        tabIndex={0}
        aria-label={heading}
        className="scrollbar-hidden flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {items.map((item, index) => {
          const size = sizeOf(index, items.length);
          return (
            <li
              key={item.id}
              className={cn('shrink-0 snap-start', SIZE_CLASSES[size])}
            >
              <CarouselCard
                item={item}
                size={size}
                icon={icon}
                singular={singular}
                onItemAction={onItemAction}
                actions={actions}
                // The lead already shows what a preview would.
                renderPreview={index === 0 ? undefined : renderPreview}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type CarouselCardProps = Pick<
  CollectionItemsProps,
  'icon' | 'singular' | 'onItemAction' | 'actions' | 'renderPreview'
> & {
  item: CollectionItem;
  size: keyof typeof SIZE_CLASSES;
};

function CarouselCard({
  item,
  size,
  icon,
  singular,
  onItemAction,
  actions,
  renderPreview,
}: CarouselCardProps) {
  const isLead = size === 'lead' || size === 'lead-only';
  const opened = item.lastViewedAt !== undefined;

  return (
    <div
      className={cn(
        'relative flex h-full flex-col rounded-md border border-border text-card-foreground transition-colors hover:bg-muted/50 motion-reduce:transition-none',
        isLead ? 'min-h-48 gap-4 bg-card p-6' : 'gap-3 bg-card p-4',
      )}
    >
      <ItemIconPreview item={item} icon={icon} renderPreview={renderPreview} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3
            className={cn(
              'min-w-0',
              isLead
                ? 'text-2xl font-medium tracking-tight'
                : 'text-sm font-medium',
            )}
          >
            <ItemOpenButton
              title={item.title}
              href={item.href}
              onOpen={() => onItemAction('open', item)}
            />
          </h3>
          {item.pinned && <PinnedMark />}
        </div>
        {size !== 'compact' && item.subtitle && (
          <p
            className={cn(
              'text-muted-foreground text-pretty',
              isLead ? 'line-clamp-3 text-sm' : 'line-clamp-2 text-xs',
            )}
          >
            {item.subtitle}
          </p>
        )}
        {size !== 'compact' && item.detail && (
          <p
            className={cn(
              'text-muted-foreground',
              isLead ? 'text-sm' : 'truncate text-xs',
            )}
          >
            {item.detail}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {opened ? 'Opened' : 'Updated'}{' '}
        <EntityDate
          as="span"
          at={item.lastViewedAt ?? item.updatedAt}
          srPrefix={undefined}
        />
      </p>

      <div className="absolute top-3 right-3">
        <ItemActionsMenu
          item={item}
          singular={singular}
          onAction={onItemAction}
          actions={actions}
        />
      </div>
    </div>
  );
}
