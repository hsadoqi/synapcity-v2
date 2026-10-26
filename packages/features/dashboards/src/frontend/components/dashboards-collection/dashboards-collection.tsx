import type { DashboardSummary } from '@synapcity/domain-dashboards';
import {
  CollectionPage,
  CollectionPageSkeleton,
} from '@synapcity/frontend-collection';

import type { SetDashboardPinnedResult } from '../../../contracts';
import { DashboardsIndex } from '../dashboards-index';

/** The page's heading and intro; shared with its skeleton so loading never changes the words. */
const DASHBOARDS_TITLE = 'Dashboards';
const DASHBOARDS_INTRO =
  'Every dashboard you have built, in a space or not. The one you used last comes first.';

interface DashboardsCollectionProps {
  dashboards: DashboardSummary[];
  /** The owner's home address; every dashboard link is built under it. */
  homePath: string;
  /** The host's pin action; the index shows a change at once and saves it through this. */
  setDashboardPinned: (
    dashboardId: string,
    pinned: boolean,
  ) => Promise<SetDashboardPinnedResult>;
  /** Where to sign in again when a pin fails because the session ended. */
  signInHref?: string;
}

export function DashboardsCollection({
  dashboards,
  homePath,
  setDashboardPinned,
  signInHref,
}: DashboardsCollectionProps) {
  return (
    <CollectionPage title={DASHBOARDS_TITLE} intro={DASHBOARDS_INTRO}>
      {/* No create button until creating a dashboard exists; one that does nothing is worse than none. */}
      <DashboardsIndex
        dashboards={dashboards}
        homePath={homePath}
        now={new Date().toISOString()}
        setDashboardPinned={setDashboardPinned}
        signInHref={signInHref}
      />
    </CollectionPage>
  );
}

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
