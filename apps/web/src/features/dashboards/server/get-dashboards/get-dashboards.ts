import type { BaseRecord } from '@synapcity/domain-records';

import {
  loadLatestRecords,
  loadRecord,
  loadRecordSummaries,
} from '@/lib/records';
import type { RecordSummary } from '@/lib/records/record-summary';

import { DASHBOARD_FIXTURES } from '../../lib/fixtures';

/**
 * The signed-in owner's dashboards with how many spaces each is in. Row-level
 * security scopes the query to the session, so no owner id is passed.
 * Development fixture mode has no session or database and reads sample records.
 */
export function getDashboards(): Promise<RecordSummary[]> {
  return loadRecordSummaries('dashboards', DASHBOARD_FIXTURES);
}

/**
 * At most `limit` of the signed-in owner's dashboards in the sidebar's order,
 * without participation counts. Fixture mode orders the sample records.
 */
export function getLatestDashboards(limit: number): Promise<BaseRecord[]> {
  return loadLatestRecords('dashboards', DASHBOARD_FIXTURES, limit);
}

/**
 * One of the signed-in owner's dashboards, or null when it does not exist or is
 * not theirs. Fixture mode reads the sample records.
 */
export function getDashboard(id: string): Promise<BaseRecord | null> {
  return loadRecord('dashboards', id, DASHBOARD_FIXTURES);
}
