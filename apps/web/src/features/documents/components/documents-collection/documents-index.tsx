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
import type { OwnedRecordSummary } from '@/lib/owned-records';

import { toCollectionItem } from '../../lib/collection-item';
import { setDocumentPinned } from '../../server/actions/document-state-actions';
import { DocumentPreview } from './document-preview';

interface DocumentsIndexProps {
  documents: OwnedRecordSummary[];
  userId: string;
  /** The moment the page was rendered, so server and browser label dates alike. */
  now: string;
}

const LABELS = { singular: 'document', plural: 'Documents' };

/** Only open and pin work for now; rename, duplicate and delete have no flow yet. */
const DOCUMENT_ACTIONS: CollectionItemAction[] = ['open', 'toggle-pin'];

const EMPTY_STATE = {
  title: 'No documents yet',
  description:
    'A document is where thinking turns into words. Everything you write shows up here, in a space or not.',
};

async function saveDocumentPinned(
  id: string,
  pinned: boolean,
): Promise<SetPinnedResult> {
  const result = await setDocumentPinned(id, pinned);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/** The documents index: the shared browse page, filled with documents. */
export function DocumentsIndex({
  documents,
  userId,
  now,
}: DocumentsIndexProps) {
  const items = useMemo<CollectionItem[]>(
    () => documents.map((record) => toCollectionItem(record, userId)),
    [documents, userId],
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
      onSetPinned={saveDocumentPinned}
    />
  );
}
