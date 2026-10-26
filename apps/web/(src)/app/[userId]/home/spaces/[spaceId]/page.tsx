import { notFound } from 'next/navigation';
import {
  RecordSpaceView,
  SpaceContent,
} from '@synapcity/features-spaces/frontend';
import { getSpace } from '@synapcity/features-spaces/server';

import { SetBreadcrumbs } from '@synapcity/frontend-shells';
import { COLLECTION_LABELS } from '../../../../../../src/components/breadcrumbs';
import { logFailure } from '../../../../../../src/features/account/server/caller';
import { requireOwner } from '../../../../../../src/lib/access/require-owner';
import { homePathFor, spacesPathFor } from '../../../../../../src/lib/routing/user-paths';
import { getSpaceSource } from '../../../../../../src/lib/spaces';
import { recordSpaceView } from '../../../../../../src/lib/spaces/space-state-actions';

export default async function SpaceShowPage({
  params,
}: {
  params: Promise<{ userId: string; spaceId: string }>;
}) {
  const { userId, spaceId } = await params;
  await requireOwner(userId);
  const awaitedSpace = await getSpace(await getSpaceSource(), spaceId, {
    // The space still shows, with a note that its items could not be loaded.
    onItemsError: (error) =>
      logFailure('getSpace items', error as { code?: string; status?: number }),
  });
  if (!awaitedSpace) notFound();

  return (
    <>
      <SetBreadcrumbs
        items={[
          {
            label: COLLECTION_LABELS.spaces,
            href: spacesPathFor(userId),
            kind: 'collection',
          },
          { label: awaitedSpace.name, kind: 'space' },
        ]}
      />
      <RecordSpaceView spaceId={spaceId} recordSpaceView={recordSpaceView} />
      <SpaceContent homePath={homePathFor(userId)} space={awaitedSpace} />
    </>
  );
}
