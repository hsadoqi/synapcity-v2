import { getLatestDashboards } from '../../features/dashboards/server/get-dashboards';
import { getLatestDocuments } from '../../features/documents/server/get-documents';
import { logFailure } from '../log-failure';
import { getSpaceSource } from '../spaces';

import {
  latestRecords,
  SIDEBAR_RECORD_LIMIT,
  type SidebarRecord,
  type SidebarRecords,
} from './latest-records';

type Kind = keyof SidebarRecords;

/**
 * One kind's records for the sidebar, or none when its read failed. The
 * failure is logged by code and status only (`logFailure`); the error's
 * message can quote row data.
 */
const settled = (
  kind: Kind,
  result: PromiseSettledResult<
    readonly (SidebarRecord & {
      pinnedAt?: string | null;
      updatedAt?: string;
    })[]
  >,
): SidebarRecord[] => {
  if (result.status === 'fulfilled') return latestRecords(result.value);
  logFailure(
    'getSidebarRecords',
    result.reason as { code?: string; status?: number } | null,
    { kind },
  );
  return [];
};

/**
 * The signed-in owner's latest Spaces, documents and dashboards for the
 * sidebar: at most `SIDEBAR_RECORD_LIMIT` of each, read already ordered and
 * bounded, with no participation counts. `latestRecords` then reduces each to
 * what the sidebar shows; its stable sort keeps the order the reads return.
 * One kind failing to load leaves that list empty, and is logged, instead of
 * breaking every page; the collection page shows the error in full.
 */
export async function getSidebarRecords(): Promise<SidebarRecords> {
  const [spaces, documents, dashboards] = await Promise.allSettled([
    getSpaceSource().then((source) => source.listLatest(SIDEBAR_RECORD_LIMIT)),
    getLatestDocuments(SIDEBAR_RECORD_LIMIT),
    getLatestDashboards(SIDEBAR_RECORD_LIMIT),
  ]);

  return {
    spaces: settled('spaces', spaces),
    documents: settled('documents', documents),
    dashboards: settled('dashboards', dashboards),
  };
}
