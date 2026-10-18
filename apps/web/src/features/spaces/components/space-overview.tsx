import { Separator } from '@synapcity/frontend-ui/core/separator';
import { RecentItems } from './recent-items';
import { SpaceHeader } from './space-header';
import { SpaceSection } from './space-section';
import type {
  DashboardItem,
  DocumentItem,
  SpaceItem,
} from '../shared/types/types';

interface SpaceOverviewProps {
  space: SpaceItem;
  showRecentItems?: boolean;
}

function getRecentItems(
  space: SpaceItem,
  limit = 3,
): (DocumentItem | DashboardItem)[] {
  return [...space.documents, ...space.dashboards]
    .sort(
      (a: DocumentItem | DashboardItem, b: DocumentItem | DashboardItem) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, limit);
}

export function SpaceOverview({
  space,
  showRecentItems = true,
}: SpaceOverviewProps) {
  const recent = showRecentItems ? getRecentItems(space) : [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-10 lg:py-14">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <SpaceHeader name={space.name} description={space.description} />
        <RecentItems items={recent} prefix={`/spaces`} />
      </div>

      <Separator />

      <div className="flex flex-col gap-12">
        <SpaceSection
          id="documents"
          title="Documents"
          items={space.documents}
          total={space.documentsTotal}
          viewAllHref="#documents"
          emptyTitle="No documents yet"
          emptyBody="Start with a loose thought. It can grow into something later."
          emptyIcon="document"
          createLabel="Write the first one"
          prefix="/documents"
        />
        <SpaceSection
          id="dashboards"
          title="Dashboards"
          items={space.dashboards}
          total={space.dashboardsTotal}
          viewAllHref="#dashboards"
          emptyTitle="No dashboards yet"
          emptyBody="A dashboard is a quiet window onto how things are going. Make one when you're curious."
          emptyIcon="boxes"
          createLabel="Make the first one"
          prefix="/dashboards"
        />
      </div>
    </div>
  );
}
