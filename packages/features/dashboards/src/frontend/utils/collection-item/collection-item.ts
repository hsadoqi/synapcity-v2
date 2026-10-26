import { itemFromRecord } from '@synapcity/frontend-collection';
import type { CollectionItem } from '@synapcity/frontend-collection';

import type { DashboardSummary } from '@synapcity/domain-dashboards';

/** A dashboard's top-level page under the owner's home address (ADR-0013, item 9). */
export function dashboardPath(homePath: string, dashboardId: string): string {
  return `${homePath}/dashboards/${dashboardId}`;
}

/** Which spaces a dashboard is in, in a few words: "In 2 spaces", or "Not in a space". */
export function describeSpaces(spaces: number) {
  if (spaces === 0) return 'Not in a space';
  return `In ${spaces} ${spaces === 1 ? 'space' : 'spaces'}`;
}

/** A dashboard as the browse feature lists it. */
export function toCollectionItem(
  record: DashboardSummary,
  homePath: string,
): CollectionItem {
  return itemFromRecord(record, {
    href: dashboardPath(homePath, record.id),
    detail: describeSpaces(record.spacesTotal),
  });
}
