import type { Metadata } from 'next';

import { DocumentsCollection } from '@synapcity/features-documents/frontend';
import { requireOwner } from '@/lib/access/require-owner';
import { getDocuments } from '@/lib/documents';
import { setDocumentPinned } from '@/lib/documents/document-state-actions';
import {
  documentsPathFor,
  homePathFor,
  signInPathFor,
} from '@/lib/routing/user-paths';

export const metadata: Metadata = { title: 'Documents' };

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  await requireOwner(userId);
  const documents = await getDocuments();

  return (
    <DocumentsCollection
      documents={documents}
      homePath={homePathFor(userId)}
      setDocumentPinned={setDocumentPinned}
      signInHref={signInPathFor(documentsPathFor(userId))}
    />
  );
}
