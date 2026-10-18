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

/** Most recently touched first, so the space you were last in is first. */
function byRecentlyUpdated(a: SpaceEntity, b: SpaceEntity): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function SpacesCollection({ spaces, userId }: SpacesCollectionProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 lg:py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Spaces
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Each space keeps related documents and dashboards in one place.
        </p>
      </header>
      <EntitySection
        id="spaces"
        title="Recently updated"
        items={[...spaces].sort(byRecentlyUpdated).map(toListedSpace)}
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
