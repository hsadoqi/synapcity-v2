import { notFound } from 'next/navigation';
import { getSpace } from '@synapcity/features-spaces/server';

import { RecordSpaceView } from '@/features/spaces/components/record-space-view';
import { SpaceContent } from '@/features/spaces/components/space-content';
import { COLLECTION_LABELS, SetBreadcrumbs } from '@/components/breadcrumbs';
import { requireOwner } from '@/lib/access/require-owner';
import { spacesPathFor } from '@/lib/routing/user-paths';
import { getSpaceSource } from '@/lib/spaces';

export default async function SpaceShowPage({
  params,
}: {
  params: Promise<{ userId: string; spaceId: string }>;
}) {
  const { userId, spaceId } = await params;
  await requireOwner(userId);
  const awaitedSpace = await getSpace(await getSpaceSource(), spaceId);
  if (!awaitedSpace) notFound();

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: COLLECTION_LABELS.spaces, href: spacesPathFor(userId) },
          { label: awaitedSpace.name },
        ]}
      />
      <RecordSpaceView spaceId={spaceId} />
      <SpaceContent userId={userId} spaceItem={awaitedSpace} />
    </>
  );
}
