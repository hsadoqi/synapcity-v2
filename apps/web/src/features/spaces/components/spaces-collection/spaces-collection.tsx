import { EntitySection } from '@synapcity/frontend-ui/blocks/entity/entity-section';

import type { Space, SpaceEntity } from '../../shared/types';

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

export function SpacesCollection({ spaces, userId }: SpacesCollectionProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 lg:py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
        Spaces
      </h1>
      <EntitySection
        id="spaces"
        title="All spaces"
        items={spaces.map(toListedSpace)}
        total={spaces.length}
        limit={spaces.length}
        emptyTitle="No spaces yet"
        emptyBody="A space keeps related documents and dashboards together."
        emptyIcon="folder"
        createLabel="Create a space"
        prefix={`/${userId}/home`}
      />
    </div>
  );
}
