'use client';

import type { Space } from '@synapcity/features-spaces/contracts';
import { EntitySection } from '@synapcity/frontend-collection';

interface SpaceOverviewProps {
  entity: Space;
  userId: string;
}

export function SpaceCollections({ entity, userId }: SpaceOverviewProps) {
  return (
    <div className="flex flex-col gap-12">
      <EntitySection
        id="documents"
        title="Documents"
        items={entity.documents}
        total={entity.documentsTotal}
        viewAllHref="#documents"
        emptyTitle="No documents yet"
        emptyBody="Start with a loose thought. It can grow into something later."
        emptyIcon="file-text"
        createLabel="Write the first one"
        prefix={`/${userId}/home/spaces/${entity.id}`}
      />
      <EntitySection
        id="dashboards"
        title="Dashboards"
        items={entity.dashboards}
        total={entity.dashboardsTotal}
        viewAllHref="#dashboards"
        emptyTitle="No dashboards yet"
        emptyBody="A dashboard is a quiet window onto how things are going. Make one when you're curious."
        emptyIcon="boxes"
        createLabel="Make the first one"
        prefix={`/${userId}/home/spaces/${entity.id}`}
      />
    </div>
  );
}
