import type { Metadata } from 'next';

import { SpacesCollection } from '@synapcity/features-spaces/frontend';
import { COLLECTION_LABELS, SetBreadcrumbs } from '@/components/breadcrumbs';
import { requireOwner } from '@/lib/access/require-owner';
import { getSpaceSource } from '@/lib/spaces';
import { setSpacePinned } from '@/lib/spaces/space-state-actions';

export const metadata: Metadata = { title: 'Spaces' };

export default async function SpacesPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  await requireOwner(userId);
  const spaces = await (await getSpaceSource()).listSummaries();

  return (
    <>
      <SetBreadcrumbs items={[{ label: COLLECTION_LABELS.spaces }]} />
      <SpacesCollection
        spaces={spaces}
        userId={userId}
        setSpacePinned={setSpacePinned}
      />
    </>
  );
}
