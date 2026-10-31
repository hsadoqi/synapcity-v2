import type { BaseRecord } from '@synapcity/domain-records';
import type { DashboardLinkItem } from '@synapcity/features-dashboards/contracts';

import {
  dashboardPathFor,
  documentPathFor,
  spacePathFor,
} from '@/lib/routing/user-paths';

type Kind = DashboardLinkItem['kind'];

const hrefFor = (kind: Kind, userId: string, id: string) =>
  kind === 'space'
    ? spacePathFor(userId, id)
    : kind === 'document'
      ? documentPathFor(userId, id)
      : dashboardPathFor(userId, id);

/**
 * The owner's records as the dashboard link widgets list them: what the
 * widgets need (name, icon, the two timestamps) and where each record opens.
 * The widgets choose and order from these, so the order given here is the
 * Spaces widget's order.
 */
export function toLinkItems(
  userId: string,
  records: {
    space: readonly BaseRecord[];
    document: readonly BaseRecord[];
    dashboard: readonly BaseRecord[];
  },
): DashboardLinkItem[] {
  return (['space', 'document', 'dashboard'] as const).flatMap((kind) =>
    records[kind].map((record) => ({
      id: record.id,
      kind,
      name: record.name,
      icon: record.icon,
      href: hrefFor(kind, userId, record.id),
      pinnedAt: record.pinnedAt ?? null,
      lastViewedAt: record.lastViewedAt ?? null,
    })),
  );
}
