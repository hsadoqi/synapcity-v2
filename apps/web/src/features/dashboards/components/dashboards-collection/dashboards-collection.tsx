import { CollectionPage } from '@synapcity/frontend-collection';
import type { RecordSummary } from '@/lib/records/record-summary';

import { DASHBOARDS_INTRO, DASHBOARDS_TITLE } from './dashboards-copy';
import { DashboardsIndex } from './dashboards-index';

interface DashboardsCollectionProps {
  dashboards: RecordSummary[];
  userId: string;
}

export function DashboardsCollection({
  dashboards,
  userId,
}: DashboardsCollectionProps) {
  return (
    <CollectionPage title={DASHBOARDS_TITLE} intro={DASHBOARDS_INTRO}>
      {/* No create button until creating a dashboard exists; one that does nothing is worse than none. */}
      <DashboardsIndex
        dashboards={dashboards}
        userId={userId}
        now={new Date().toISOString()}
      />
    </CollectionPage>
  );
}
