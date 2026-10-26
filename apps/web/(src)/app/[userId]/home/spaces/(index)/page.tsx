import type { Metadata } from 'next';

import { SpacesCollection } from '@synapcity/features-spaces/frontend';
import { SetBreadcrumbs } from '@synapcity/frontend-shells';
import { COLLECTION_LABELS } from '../../../../../../src/components/breadcrumbs';
import { requireOwner } from '../../../../../../src/lib/access/require-owner';
import {
  homePathFor,
  signInPathFor,
  spacesPathFor,
} from '../../../../../../src/lib/routing/user-paths';
import { getSpaceSource } from '../../../../../../src/lib/spaces';
import { setSpacePinned } from '../../../../../../src/lib/spaces/space-state-actions';

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
      <SetBreadcrumbs
        items={[{ label: COLLECTION_LABELS.spaces, kind: 'collection' }]}
      />
      <SpacesCollection
        spaces={spaces}
        homePath={homePathFor(userId)}
        setSpacePinned={setSpacePinned}
        signInHref={signInPathFor(spacesPathFor(userId))}
      />
    </>
  );
}
