import { getDashboards } from '../../features/dashboards/server/get-dashboards';
import { getDocuments } from '../../features/documents/server/get-documents';
import { getSpaceSource } from '../spaces';

import {
  latestRecords,
  type SidebarRecord,
  type SidebarRecords,
} from './latest-records';

const settled = (
  result: PromiseSettledResult<
    readonly (SidebarRecord & {
      pinnedAt?: string | null;
      updatedAt?: string;
    })[]
  >,
) => (result.status === 'fulfilled' ? latestRecords(result.value) : []);

/**
 * The signed-in owner's latest Spaces, documents and dashboards for the
 * sidebar. One kind failing to load leaves that list empty instead of
 * breaking every page; the collection page shows the error in full.
 */
export async function getSidebarRecords(): Promise<SidebarRecords> {
  const [spaces, documents, dashboards] = await Promise.allSettled([
    getSpaceSource().then((source) => source.listSummaries()),
    getDocuments(),
    getDashboards(),
  ]);

  return {
    spaces: settled(spaces),
    documents: settled(documents),
    dashboards: settled(dashboards),
  };
}
