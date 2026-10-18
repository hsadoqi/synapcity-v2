import { EntitySection } from '@synapcity/frontend-ui/blocks/entity/entity-section';

import type { Space, SpaceEntity } from '../../shared/types';
import { SpacesHeader } from './spaces-header';

interface SpacesCollectionProps {
  spaces: SpaceEntity[];
  userId: string;
}

/** A saved space has no documents or dashboards loaded when it is listed. */
function toListedSpace(space: SpaceEntity): Space {
  return {
    ...space,
    kind: 'space',
    documents: [],
    dashboards: [],
    documentsTotal: 0,
    dashboardsTotal: 0,
  };
}

/** Most recently touched first, so the space you were last in is first. */
function byRecentlyUpdated(a: SpaceEntity, b: SpaceEntity): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function SpacesCollection({ spaces, userId }: SpacesCollectionProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 lg:py-12">
      <SpacesHeader />
      {/* No createHref until creating a space exists; a button that does nothing is worse than none. */}
      <EntitySection
        id="spaces"
        title="All spaces"
        noun={{ one: 'space', other: 'spaces' }}
        items={[...spaces].sort(byRecentlyUpdated).map(toListedSpace)}
        total={spaces.length}
        limit={spaces.length}
        emptyTitle="No spaces yet"
        emptyBody="Spaces you make will show up here."
        emptyIcon="folder"
        createLabel="Create a space"
        prefix={`/${userId}/home`}
      />
    </div>
  );
}
