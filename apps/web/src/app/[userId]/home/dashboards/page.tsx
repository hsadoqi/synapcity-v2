import type { Metadata } from 'next';

import { DashboardsCollection } from '@/features/dashboards/components/dashboards-collection';
import { getDashboards } from '@/features/dashboards/server/get-dashboards';
import { SetBreadcrumbs } from '@synapcity/frontend-shells';
import { COLLECTION_LABELS } from '@/components/breadcrumbs';
import { requireOwner } from '@/lib/access/require-owner';

export const metadata: Metadata = { title: 'Dashboards' };

export default async function DashboardsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  await requireOwner(userId);
  const dashboards = await getDashboards();

  return (
    <>
      <SetBreadcrumbs items={[{ label: COLLECTION_LABELS.dashboards }]} />
      <DashboardsCollection dashboards={dashboards} userId={userId} />
    </>
  );
}
