'use client';

import {
  CollectionListRow,
  type CollectionItemsProps,
} from '../collection-item';

export function CollectionList({ items, ...itemProps }: CollectionItemsProps) {
  return (
    <ul
      role="list"
      className="flex flex-col divide-y divide-border rounded-md border border-border bg-card text-card-foreground"
    >
      {items.map((item) => (
        <CollectionListRow key={item.id} item={item} {...itemProps} />
      ))}
    </ul>
  );
}
