'use client';

import { EntitySection } from '@synapcity/frontend-collection';

import type { DashboardItem, DocumentItem, Space } from '../../../contracts';
import { spaceItemPath, spacePath } from '../../utils';

/** Only what the sections show, so the client gets no more of the Space. */
type SpaceSections = Pick<
  Space,
  'id' | 'documents' | 'dashboards' | 'documentsTotal' | 'dashboardsTotal'
>;

interface SpaceCollectionsProps {
  space: SpaceSections;
  /** The owner's home address; item links are built under it. */
  homePath: string;
}

/** The documents and dashboards taking part in a Space, each linked to its nested route. */
export function SpaceCollections({ space, homePath }: SpaceCollectionsProps) {
  const prefix = spacePath(homePath, space.id);
  const withHref = (item: DocumentItem | DashboardItem) => ({
    ...item,
    href: spaceItemPath(homePath, space.id, item),
  });
  return (
    <div className="flex flex-col gap-12">
      <EntitySection
        id="documents"
        title="Documents"
        items={space.documents.map(withHref)}
        total={space.documentsTotal}
        viewAllHref="#documents"
        emptyTitle="No documents yet"
        emptyBody="Start with a loose thought. It can grow into something later."
        emptyIcon="file-text"
        createLabel="Write the first one"
        prefix={prefix}
      />
      <EntitySection
        id="dashboards"
        title="Dashboards"
        items={space.dashboards.map(withHref)}
        total={space.dashboardsTotal}
        viewAllHref="#dashboards"
        emptyTitle="No dashboards yet"
        emptyBody="A dashboard is a quiet window onto how things are going. Make one when you're curious."
        emptyIcon="boxes"
        createLabel="Make the first one"
        prefix={prefix}
      />
    </div>
  );
}
