import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BreadcrumbMenu } from '@synapcity/frontend-shells';

import { COLLECTION_LABELS } from '@/components/collections';
import { DashboardView } from '@/features/dashboards/components/dashboard-view';
import { RecordDashboardView } from '@/features/dashboards/components/record-dashboard-view';
import { recordDashboardView } from '@/features/dashboards/server/actions/dashboard-composition-actions';
import { getDashboardComposition } from '@/features/dashboards/server/get-composition';
import { getDashboard } from '@/features/dashboards/server/get-dashboards';
import { getDashboardLinkItems } from '@/features/dashboards/server/get-link-items';
import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { requireOwner } from '@/lib/access/require-owner';
import { dashboardsPathFor } from '@/lib/routing/user-paths';

type Params = Promise<{ userId: string; dashboardId: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { dashboardId } = await params;
  const dashboard = await getDashboard(dashboardId);
  // Not found here too: metadata can stream before the page, and a response
  // that has started cannot change its status to 404 afterwards.
  if (!dashboard) notFound();
  return { title: dashboard.name };
}

/**
 * One dashboard at its top-level route (ADR-0013), editable and saved to the
 * database (ADR-0016). Row-level security makes another person's dashboard
 * read as missing, so it is not found rather than forbidden. A composition
 * that cannot be read throws to the route's error page, never to an empty
 * canvas that a save would then overwrite it with.
 */
export default async function DashboardShowPage({
  params,
}: {
  params: Params;
}) {
  const { userId, dashboardId } = await params;
  await requireOwner(userId);
  const dashboard = await getDashboard(dashboardId);
  if (!dashboard) notFound();
  // The composition first: it says which kinds of record the link widgets list,
  // so only those are read.
  const { composition, revision } = await getDashboardComposition(dashboardId);
  const { items, unavailableKinds, unloadedKinds } =
    await getDashboardLinkItems(userId, composition);

  return (
    <>
      <BreadcrumbMenu
        items={[
          {
            label: COLLECTION_LABELS.dashboards,
            href: dashboardsPathFor(userId),
            kind: 'collection',
          },
          { label: dashboard.name },
        ]}
      />
      <RecordDashboardView
        dashboardId={dashboardId}
        record={recordDashboardView}
      />
      <DashboardView
        dashboard={dashboard}
        composition={composition}
        revision={revision}
        items={items}
        unavailableKinds={unavailableKinds}
        unloadedKinds={unloadedKinds}
        persistence={fixtureModeEnabled() ? 'browser' : 'server'}
      />
    </>
  );
}
