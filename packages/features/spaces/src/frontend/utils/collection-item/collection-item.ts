import { itemFromRecord } from '@synapcity/frontend-collection';
import type { CollectionItem } from '@synapcity/frontend-collection';

import type { SpaceSummary } from '@synapcity/domain-records';

import { spacePath } from '../space-paths';

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** What a space holds, in a few words: "8 documents · 1 dashboard", or "Nothing in it yet". */
export function describeContents(documents: number, dashboards: number) {
  if (documents === 0 && dashboards === 0) return 'Nothing in it yet';
  return [
    documents > 0 ? count(documents, 'document') : null,
    dashboards > 0 ? count(dashboards, 'dashboard') : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** A space as the browse feature lists it. */
export function toCollectionItem(
  space: SpaceSummary,
  homePath: string,
): CollectionItem {
  return itemFromRecord(space, {
    href: spacePath(homePath, space.id),
    detail: describeContents(space.documentsTotal, space.dashboardsTotal),
  });
}
