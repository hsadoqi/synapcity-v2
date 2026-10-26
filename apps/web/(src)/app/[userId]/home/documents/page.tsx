import type { Metadata } from 'next';

import { DocumentsCollection } from '../../../../../src/features/documents/components/documents-collection';
import { getDocuments } from '../../../../../src/features/documents/server/get-documents';
import { SetBreadcrumbs } from '@synapcity/frontend-shells';
import { COLLECTION_LABELS } from '../../../../../src/components/breadcrumbs';
import { requireOwner } from '../../../../../src/lib/access/require-owner';

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
    <>
      <SetBreadcrumbs
        items={[{ label: COLLECTION_LABELS.documents, kind: 'collection' }]}
      />
      <DocumentsCollection documents={documents} userId={userId} />
    </>
  );
}
