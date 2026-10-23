'use client';

import { SectionHeading } from '@synapcity/frontend-ui/components/section-heading';
import { EmptyNote } from '@synapcity/frontend-ui/components/empty-note';

import type { CollectionItem } from '../../shared';
import { ItemActionsMenu } from '../collection-item/item-actions-menu';
import { ItemIconPreview } from '../collection-item/item-icon-preview';
import { ItemOpenButton } from '../collection-item/item-open-button';
import type { CollectionItemsProps } from '../collection-item/item-props';

type PinnedPanelProps = Omit<CollectionItemsProps, 'now' | 'showGroup'> & {
  /** The heading's id. Unique on the page. */
  id: string;
  heading: string;
  /** Shown when nothing is pinned. */
  emptyMessage: React.ReactNode;
};

/** The pinned items in a compact list that stays put while the rest changes. */
export function PinnedPanel({
  id,
  heading,
  emptyMessage,
  items,
  icon,
  singular,
  onItemAction,
  actions,
  renderPreview,
}: PinnedPanelProps) {
  return (
    <section
      aria-labelledby={id}
      className="flex min-w-0 flex-col gap-3 rounded-md border border-border p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <SectionHeading id={id}>{heading}</SectionHeading>
        <span className="text-xs text-muted-foreground tabular-nums">
          <span className="sr-only">, </span>
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyNote>{emptyMessage}</EmptyNote>
      ) : (
        <ul role="list" className="flex flex-col gap-1">
          {items.map((item) => (
            <PinnedRow
              key={item.id}
              item={item}
              icon={icon}
              singular={singular}
              onItemAction={onItemAction}
              actions={actions}
              renderPreview={renderPreview}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function PinnedRow({
  item,
  icon,
  singular,
  onItemAction,
  actions,
  renderPreview,
}: Pick<
  CollectionItemsProps,
  'icon' | 'singular' | 'onItemAction' | 'actions' | 'renderPreview'
> & { item: CollectionItem }) {
  return (
    <li className="relative flex items-center gap-2 rounded-md py-1 pr-1 pl-1 transition-colors hover:bg-muted/50 motion-reduce:transition-none">
      <ItemIconPreview item={item} icon={icon} renderPreview={renderPreview} />
      <div className="flex min-w-0 flex-1 items-center">
        <ItemOpenButton
          title={item.title}
          href={item.href}
          onOpen={() => onItemAction('open', item)}
        />
      </div>
      <ItemActionsMenu
        item={item}
        singular={singular}
        onAction={onItemAction}
        actions={actions}
      />
    </li>
  );
}
