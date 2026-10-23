import { CollectionPageSkeleton } from '@/features/collection/components/collection-page';

import { DASHBOARDS_INTRO, DASHBOARDS_TITLE } from './dashboards-copy';

/** The dashboards page while its dashboards load. */
export function DashboardsCollectionSkeleton() {
  return (
    <CollectionPageSkeleton
      title={DASHBOARDS_TITLE}
      intro={DASHBOARDS_INTRO}
      loadingLabel="Loading dashboards"
    />
  );
}
