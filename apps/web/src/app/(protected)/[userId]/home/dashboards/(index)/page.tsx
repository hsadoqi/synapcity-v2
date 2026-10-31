import type { Metadata } from 'next';
import { DashboardsCollection } from '@/features/dashboards/components/dashboards-collection';
import { getDashboards } from '@/features/dashboards/server/get-dashboards';
import { BreadcrumbMenu } from '@synapcity/frontend-shells';
import { COLLECTION_LABELS } from '@/components/collections';
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
      <BreadcrumbMenu
        items={[{ label: COLLECTION_LABELS.dashboards, kind: 'collection' }]}
      />
      <DashboardsCollection dashboards={dashboards} userId={userId} />
    </>
  );
}
