import { itemFromRecord } from '@/features/collection/shared';
import type { CollectionItem } from '@/features/collection/shared';
import type { OwnedRecordSummary } from '@/lib/owned-records';

/** Which spaces a document is in, in a few words: "In 2 spaces", or "Not in a space". */
export function describeSpaces(spaces: number) {
  if (spaces === 0) return 'Not in a space';
  return `In ${spaces} ${spaces === 1 ? 'space' : 'spaces'}`;
}

/** A document as the browse feature lists it. */
export function toCollectionItem(
  record: OwnedRecordSummary,
  userId: string,
): CollectionItem {
  return itemFromRecord(record, {
    href: `/${userId}/home/documents/${record.id}`,
    detail: describeSpaces(record.spacesTotal),
  });
}
