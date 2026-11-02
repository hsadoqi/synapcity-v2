import { itemFromRecord } from '@synapcity/frontend-collection';
import type { CollectionItem } from '@synapcity/frontend-collection';
import { describeSpaceCount } from '@/lib/records/describe-space-count';
import type { RecordSummary } from '@/lib/records/record-summary';
import { documentPathFor } from '@/lib/routing/user-paths';

/** A document as the browse feature lists it. */
export function toCollectionItem(
  record: RecordSummary,
  userId: string,
): CollectionItem {
  return itemFromRecord(record, {
    href: documentPathFor(userId, record.id),
    detail: describeSpaceCount(record.spacesTotal),
  });
}
