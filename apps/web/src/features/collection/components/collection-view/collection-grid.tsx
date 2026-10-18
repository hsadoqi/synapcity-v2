'use client';

import {
  CollectionGridCard,
  type CollectionItemsProps,
} from '../collection-item';

export function CollectionGrid({ items, ...itemProps }: CollectionItemsProps) {
  return (
    <ul
      role="list"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      {items.map((item) => (
        <CollectionGridCard key={item.id} item={item} {...itemProps} />
      ))}
    </ul>
  );
}
