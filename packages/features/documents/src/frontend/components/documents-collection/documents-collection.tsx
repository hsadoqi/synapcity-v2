import type { DocumentSummary } from '@synapcity/domain-documents';
import {
  CollectionPage,
  CollectionPageSkeleton,
} from '@synapcity/frontend-collection';

import type { SetDocumentPinnedResult } from '../../../contracts';
import { DocumentsIndex } from '../documents-index';

/** The page's heading and intro; shared with its skeleton so loading never changes the words. */
const DOCUMENTS_TITLE = 'Documents';
const DOCUMENTS_INTRO =
  'Everything you have written, in a space or not. The one you used last comes first.';

interface DocumentsCollectionProps {
  documents: DocumentSummary[];
  /** The owner's home address; every document link is built under it. */
  homePath: string;
  /** The host's pin action; the index shows a change at once and saves it through this. */
  setDocumentPinned: (
    documentId: string,
    pinned: boolean,
  ) => Promise<SetDocumentPinnedResult>;
  /** Where to sign in again when a pin fails because the session ended. */
  signInHref?: string;
}

export function DocumentsCollection({
  documents,
  homePath,
  setDocumentPinned,
  signInHref,
}: DocumentsCollectionProps) {
  return (
    <CollectionPage title={DOCUMENTS_TITLE} intro={DOCUMENTS_INTRO}>
      {/* No create button until creating a document exists; one that does nothing is worse than none. */}
      <DocumentsIndex
        documents={documents}
        homePath={homePath}
        now={new Date().toISOString()}
        setDocumentPinned={setDocumentPinned}
        signInHref={signInHref}
      />
    </CollectionPage>
  );
}

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
