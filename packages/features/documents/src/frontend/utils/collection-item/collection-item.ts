import { itemFromRecord } from '@synapcity/frontend-collection';
import type { CollectionItem } from '@synapcity/frontend-collection';

import type { DocumentSummary } from '@synapcity/domain-documents';

/** A document's top-level page under the owner's home address (ADR-0013, item 9). */
export function documentPath(homePath: string, documentId: string): string {
  return `${homePath}/documents/${documentId}`;
}

/** Which spaces a document is in, in a few words: "In 2 spaces", or "Not in a space". */
export function describeSpaces(spaces: number) {
  if (spaces === 0) return 'Not in a space';
  return `In ${spaces} ${spaces === 1 ? 'space' : 'spaces'}`;
}

/** A document as the browse feature lists it. */
export function toCollectionItem(
  record: DocumentSummary,
  homePath: string,
): CollectionItem {
  return itemFromRecord(record, {
    href: documentPath(homePath, record.id),
    detail: describeSpaces(record.spacesTotal),
  });
}
