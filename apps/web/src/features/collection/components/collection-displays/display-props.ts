import type { LucideIcon } from 'lucide-react';

import type { CollectionItem } from '../../shared';
import type { CollectionKinds } from './item-kind';

/** What every item display takes: the section's words, the items, and how to show them. */
export type CollectionDisplayProps = {
  /** The section heading's id. Unique on the page. */
  id: string;
  heading: string;
  headingIcon?: LucideIcon;
  emptyMessage: React.ReactNode;
  items: CollectionItem[];
  kinds: CollectionKinds;
  /** The time "how long ago" labels are measured from. */
  now: Date;
  /** For "how long ago" labels; the viewer's own when omitted. */
  timeZone?: string;
  onOpen?: (item: CollectionItem) => void;
};

/** The props one display's item card or row takes. */
export type CollectionDisplayItemProps = Pick<
  CollectionDisplayProps,
  'kinds' | 'now' | 'timeZone' | 'onOpen'
> & { item: CollectionItem };
