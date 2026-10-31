import type { BaseRecord } from '@synapcity/domain-records';
import type { DashboardLinkItem } from '@synapcity/features-dashboards/contracts';

import { getDocuments } from '@/features/documents/server/get-documents';
import { getSpaceSource } from '@/lib/spaces';

import { toLinkItems } from '../../lib/link-items';
import { getDashboards } from '../get-dashboards';

const settled = (result: PromiseSettledResult<readonly BaseRecord[]>) =>
  result.status === 'fulfilled' ? result.value : [];

/**
 * What the Pinned, Last opened and Spaces widgets list: the owner's Spaces,
 * documents and dashboards, each with its page. One kind failing to load
 * leaves that kind out instead of breaking the dashboard.
 */
export async function getDashboardLinkItems(
  userId: string,
): Promise<DashboardLinkItem[]> {
  const [space, document, dashboard] = await Promise.allSettled([
    getSpaceSource().then((source) => source.listSummaries()),
    getDocuments(),
    getDashboards(),
  ]);
  return toLinkItems(userId, {
    space: settled(space),
    document: settled(document),
    dashboard: settled(dashboard),
  });
}
