'use client';

import { CollectionListRow } from '../collection-list-row';
import type { CollectionItemsProps } from '../../types';

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
