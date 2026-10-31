import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SetBreadcrumbs } from '@synapcity/frontend-shells';

import { COLLECTION_LABELS } from '@/components/collections';
import { DocumentView } from '@/features/documents/components/document-view';
import { getDocument } from '@/features/documents/server/get-documents';
import { requireOwner } from '@/lib/access/require-owner';
import { documentsPathFor } from '@/lib/routing/user-paths';

type Params = Promise<{ userId: string; documentId: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { documentId } = await params;
  const document = await getDocument(documentId);
  // Not found here too: metadata can stream before the page, and a response
  // that has started cannot change its status to 404 afterwards.
  if (!document) notFound();
  return { title: document.name };
}

/**
 * One document, read-only, at its top-level route (ADR-0013). Row-level
 * security makes another person's document read as missing, so it is not
 * found rather than forbidden.
 */
export default async function DocumentShowPage({ params }: { params: Params }) {
  const { userId, documentId } = await params;
  await requireOwner(userId);
  const document = await getDocument(documentId);
  if (!document) notFound();

  return (
    <>
      <SetBreadcrumbs
        items={[
          {
            label: COLLECTION_LABELS.documents,
            href: documentsPathFor(userId),
            kind: 'collection',
          },
          { label: document.name },
        ]}
      />
      <DocumentView document={document} />
    </>
  );
}
