import type { CollectionItem } from './types';

/**
 * The fields every saved record of one kind of item has in common: a name, an
 * optional description, an icon name, tags, timestamps, and when it was pinned
 * and last opened. Structural, so any resource's record fits without `collection`
 * knowing which resource it is.
 */
export type RecordLike = {
  id: string;
  name: string;
  description?: string;
  icon: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  pinnedAt: string | null;
  lastViewedAt: string | null;
};

/** A saved record as the browse feature lists it. Pinned is "has a pinned time". */
export function itemFromRecord(
  record: RecordLike,
  extras: { href: string; detail?: string },
): CollectionItem {
  return {
    id: record.id,
    title: record.name,
    subtitle: record.description,
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
    tags: record.tags,
    pinned: record.pinnedAt !== null,
    icon: record.icon,
    href: extras.href,
    lastViewedAt: record.lastViewedAt ?? undefined,
    detail: extras.detail,
  };
}
