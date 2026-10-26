import type { Metadata } from 'next';

import { DashboardsCollection } from '../../../../../src/features/dashboards/components/dashboards-collection';
import { getDashboards } from '../../../../../src/features/dashboards/server/get-dashboards';
import { SetBreadcrumbs } from '@synapcity/frontend-shells';
import { COLLECTION_LABELS } from '../../../../../src/components/breadcrumbs';
import { requireOwner } from '../../../../../src/lib/access/require-owner';

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
      <SetBreadcrumbs
        items={[{ label: COLLECTION_LABELS.dashboards, kind: 'collection' }]}
      />
      <DashboardsCollection dashboards={dashboards} userId={userId} />
    </>
  );
}
