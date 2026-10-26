'use client';

import { useMemo } from 'react';
import { FileText } from 'lucide-react';

import {
  CollectionIndex,
  type SetPinnedResult,
} from '@synapcity/frontend-collection';
import type {
  CollectionItem,
  CollectionItemAction,
} from '@synapcity/frontend-collection';

import type { DocumentSummary } from '@synapcity/domain-documents';

import type { SetDocumentPinnedResult } from '../../../contracts';
import { toCollectionItem } from '../../utils';
import { DocumentPreview } from '../document-preview';

interface DocumentsIndexProps {
  documents: DocumentSummary[];
  homePath: string;
  /** The moment the page was rendered, so server and browser label dates alike. */
  now: string;
  setDocumentPinned: (
    documentId: string,
    pinned: boolean,
  ) => Promise<SetDocumentPinnedResult>;
  signInHref?: string;
}

const LABELS = { singular: 'document', plural: 'Documents' };

/** Only open and pin work for now; rename, duplicate and delete have no flow yet. */
const DOCUMENT_ACTIONS: CollectionItemAction[] = ['open', 'toggle-pin'];

const EMPTY_STATE = {
  title: 'No documents yet',
  description:
    'A document is where thinking turns into words. Everything you write shows up here, in a space or not.',
};

/** The documents index: the shared browse page, filled with documents. */
export function DocumentsIndex({
  documents,
  homePath,
  now,
  setDocumentPinned,
  signInHref,
}: DocumentsIndexProps) {
  const items = useMemo<CollectionItem[]>(
    () => documents.map((record) => toCollectionItem(record, homePath)),
    [documents, homePath],
  );

  return (
    <CollectionIndex
      items={items}
      now={now}
      labels={LABELS}
      icon={FileText}
      heading="All documents"
      recentHeading="Recently used"
      pinnedHeading="Pinned"
      pinnedEmptyMessage="Pin a document from its menu to keep it here."
      emptyState={EMPTY_STATE}
      actions={DOCUMENT_ACTIONS}
      renderPreview={(item) => <DocumentPreview item={item} />}
      onSetPinned={async (id, pinned): Promise<SetPinnedResult> => {
        const result = await setDocumentPinned(id, pinned);
        return result.ok
          ? { ok: true }
          : { ok: false, error: result.error, signedOut: result.signedOut };
      }}
      signInHref={signInHref}
    />
  );
}
