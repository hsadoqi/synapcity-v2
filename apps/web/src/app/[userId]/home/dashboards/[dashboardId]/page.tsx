import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SetBreadcrumbs } from '@synapcity/frontend-shells';

import { COLLECTION_LABELS } from '@/components/collections';
import { DashboardView } from '@/features/dashboards/components/dashboard-view';
import { getDashboard } from '@/features/dashboards/server/get-dashboards';
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
 * One dashboard, read-only, at its top-level route (ADR-0013). Row-level
 * security makes another person's dashboard read as missing, so it is not
 * found rather than forbidden.
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

  return (
    <>
      <SetBreadcrumbs
        items={[
          {
            label: COLLECTION_LABELS.dashboards,
            href: dashboardsPathFor(userId),
            kind: 'collection',
          },
          { label: dashboard.name },
        ]}
      />
      <DashboardView dashboard={dashboard} />
    </>
  );
}
