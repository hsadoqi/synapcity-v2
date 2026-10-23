import type { Metadata } from 'next';

import { SpacesCollection } from '@/features/spaces/components/spaces-collection';
import { getSpaces } from '@/features/spaces/server/get-spaces';
import { COLLECTION_LABELS, SetBreadcrumbs } from '@/components/breadcrumbs';
import { requireOwner } from '@/lib/access/require-owner';

export const metadata: Metadata = { title: 'Spaces' };

export default async function SpacesPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  await requireOwner(userId);
  const spaces = await getSpaces();

  return (
    <>
      <SetBreadcrumbs items={[{ label: COLLECTION_LABELS.spaces }]} />
      <SpacesCollection spaces={spaces} userId={userId} />
    </>
  );
}
