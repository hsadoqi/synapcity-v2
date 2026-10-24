import { EntityContent } from '@synapcity/frontend-collection';
import type { EntityItem } from '@synapcity/frontend-collection';
import { Alert, AlertDescription } from '@synapcity/frontend-ui/core/alert';

import type { Space } from '../../../contracts';
import { spaceItemPath } from '../../utils';
import { SpaceCollections } from '../space-collections';

/** The most recently changed documents and dashboards, linked like the sections link them. */
function getRecentSpaceItems(
  space: Space,
  homePath: string,
  limit = 3,
): EntityItem[] {
  return [...space.documents, ...space.dashboards]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, limit)
    .map((item) => ({
      ...item,
      href: spaceItemPath(homePath, space.id, item),
    }));
}

/** One space's page: its header, what changed last, and what takes part in it. */
export function SpaceContent({
  homePath,
  space,
}: {
  /** The owner's home address; item links are built under it. */
  homePath: string;
  space: Space;
}) {
  const { id, documents, dashboards, documentsTotal, dashboardsTotal } = space;
  return (
    <EntityContent
      entity={space}
      getRecentItems={(entity) => getRecentSpaceItems(entity, homePath)}
    >
      {space.itemsUnavailable ? (
        // Empty states here would say the space is empty when it is only unknown.
        <Alert variant="destructive">
          <AlertDescription>
            The documents and dashboards in this space could not be loaded. Try
            again in a moment.
          </AlertDescription>
        </Alert>
      ) : (
        <SpaceCollections
          homePath={homePath}
          space={{ id, documents, dashboards, documentsTotal, dashboardsTotal }}
        />
      )}
    </EntityContent>
  );
}
