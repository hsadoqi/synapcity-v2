import { dashboardSchema } from '@synapcity/domain-dashboards';
import type { DashboardSummary } from '@synapcity/domain-dashboards';
import type { SupabaseServerClient } from '@synapcity/server-supabase';

import { fieldsFromRow } from '../owned-row';
import {
  listOwnedRecordSummaries,
  setOwnedRecordPinned,
} from '../records/owned-records';

/** The signed-in owner's dashboards with how many Spaces each is in, newest first. */
export function listDashboardSummaries(
  client: SupabaseServerClient,
): Promise<DashboardSummary[]> {
  return listOwnedRecordSummaries(client, 'dashboards', (row) =>
    dashboardSchema.parse(fieldsFromRow(row)),
  );
}

/** Pins or unpins one of the caller's dashboards; the database stamps the time. */
export function setDashboardPinned(
  client: SupabaseServerClient,
  dashboardId: string,
  pinned: boolean,
) {
  return setOwnedRecordPinned(client, 'dashboards', dashboardId, pinned);
}
