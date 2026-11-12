import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import type { CollectionItem, CollectionItemAction } from './collection';

/** Props shared by the grid and the list: everything needed to draw the items. */
export type CollectionItemsProps = {
  items: CollectionItem[];
  icon: LucideIcon;
  singular: string;
  /** Show each item's group (e.g. its space) on the card or row. */
  showGroup: boolean;
  now: Date;
  onItemAction: (action: CollectionItemAction, item: CollectionItem) => void;
  /** Which actions the item menu offers. Omit for all of them. */
  actions?: CollectionItemAction[];
  /** Content for the card shown when an item's icon is hovered. Omit for none. */
  renderPreview?: (item: CollectionItem) => ReactNode;
};

/** Props for one grid card or list row. */
export type CollectionItemCardProps = Omit<CollectionItemsProps, 'items'> & {
  item: CollectionItem;
};
