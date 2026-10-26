import type { Metadata } from 'next';

import { DashboardsCollection } from '@synapcity/features-dashboards/frontend';
import { requireOwner } from '@/lib/access/require-owner';
import { getDashboards } from '@/lib/dashboards';
import { setDashboardPinned } from '@/lib/dashboards/dashboard-state-actions';
import {
  dashboardsPathFor,
  homePathFor,
  signInPathFor,
} from '@/lib/routing/user-paths';

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
    <DashboardsCollection
      dashboards={dashboards}
      homePath={homePathFor(userId)}
      setDashboardPinned={setDashboardPinned}
      signInHref={signInPathFor(dashboardsPathFor(userId))}
    />
  );
}
