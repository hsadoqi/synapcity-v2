import { EntityContent, EntityItemCard } from '@synapcity/frontend-collection';
import type { EntityItem } from '@synapcity/frontend-collection';
import type { Space } from '@synapcity/features-spaces/contracts';
import { SpaceCollections } from './space-collections';
import { createSpaceFixture } from '../lib/fixtures';

function getRecentSpaceItems(entity: Space, limit = 3): EntityItem[] {
  const space = entity as Partial<Space>;
  return [...(space.documents ?? []), ...(space.dashboards ?? [])]
    .sort(
      (a: EntityItem, b: EntityItem) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, limit);
}

export function SpaceContent({
  userId,
  spaceItem,
}: {
  userId: string;
  spaceItem?: Space;
}) {
  const entityItem = createSpaceFixture({ ownerId: userId });
  return (
    <EntityContent
      userId={userId}
      getRecentItems={getRecentSpaceItems}
      createFixture={spaceItem ? () => spaceItem : createSpaceFixture}
    >
      <>
        {spaceItem ? (
          <SpaceCollections entity={spaceItem} userId={userId} />
        ) : (
          <div className="flex flex-col gap-12">
            <EntityItemCard
              key={entityItem.id}
              entity={entityItem}
              slug={`/${userId}/home/spaces`}
            />
          </div>
        )}
      </>
    </EntityContent>
  );
}
