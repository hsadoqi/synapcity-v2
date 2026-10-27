import { CollectionPage } from '@synapcity/frontend-collection';
import type { OwnedRecordSummary } from '@synapcity/domain-records';

import { DOCUMENTS_INTRO, DOCUMENTS_TITLE } from './documents-copy';
import { DocumentsIndex } from './documents-index';

interface DocumentsCollectionProps {
  documents: OwnedRecordSummary[];
  userId: string;
}

export function DocumentsCollection({
  documents,
  userId,
}: DocumentsCollectionProps) {
  return (
    <CollectionPage title={DOCUMENTS_TITLE} intro={DOCUMENTS_INTRO}>
      {/* No create button until creating a document exists; one that does nothing is worse than none. */}
      <DocumentsIndex
        documents={documents}
        userId={userId}
        now={new Date().toISOString()}
      />
    </CollectionPage>
  );
}
