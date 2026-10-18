import type { CollectionItem } from '@/features/collection/shared';

import type { SpaceSummary } from '../../shared/types';

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** What a space holds, in a few words: "8 documents · 1 dashboard", or "Empty". */
export function describeContents(documents: number, dashboards: number) {
  if (documents === 0 && dashboards === 0) return 'Empty';
  return [
    documents > 0 ? count(documents, 'document') : null,
    dashboards > 0 ? count(dashboards, 'dashboard') : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** A space as the browse feature lists it. Pinned is "has a pinned time". */
export function toCollectionItem(
  space: SpaceSummary,
  userId: string,
): CollectionItem {
  return {
    id: space.id,
    title: space.name,
    subtitle: space.description,
    updatedAt: space.updatedAt,
    createdAt: space.createdAt,
    tags: space.tags,
    pinned: space.pinnedAt !== null,
    icon: space.icon,
    href: `/${userId}/home/spaces/${space.id}`,
    lastViewedAt: space.lastViewedAt ?? undefined,
    detail: describeContents(space.documentsTotal, space.dashboardsTotal),
  };
}
