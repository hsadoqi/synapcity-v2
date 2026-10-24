import { CollectionPageSkeleton } from '@synapcity/frontend-collection';

import { DOCUMENTS_INTRO, DOCUMENTS_TITLE } from './documents-copy';

/** The documents page while its documents load. */
export function DocumentsCollectionSkeleton() {
  return (
    <CollectionPageSkeleton
      title={DOCUMENTS_TITLE}
      intro={DOCUMENTS_INTRO}
      loadingLabel="Loading documents"
    />
  );
}
