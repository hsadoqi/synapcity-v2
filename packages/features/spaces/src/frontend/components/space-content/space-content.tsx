import { EntityContent } from '@synapcity/frontend-collection';
import type { EntityItem } from '@synapcity/frontend-collection';

import type { Space } from '../../../contracts';
import { SpaceCollections } from '../space-collections';

/** The most recently changed documents and dashboards in the space. */
function getRecentSpaceItems(space: Space, limit = 3): EntityItem[] {
  return [...space.documents, ...space.dashboards]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, limit);
}

/** One space's page: its header, what changed last, and what takes part in it. */
export function SpaceContent({
  userId,
  space,
}: {
  userId: string;
  space: Space;
}) {
  return (
    <EntityContent entity={space} getRecentItems={getRecentSpaceItems}>
      <SpaceCollections entity={space} userId={userId} />
    </EntityContent>
  );
}
