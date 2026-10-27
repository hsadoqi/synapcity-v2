import type { OwnedRecordSummary } from '@synapcity/domain-records';

import { loadRecordSummaries } from '@/lib/records';

import { DASHBOARD_FIXTURES } from '../../lib/fixtures';

/**
 * The signed-in owner's dashboards with how many spaces each is in. Row-level
 * security scopes the query to the session, so no owner id is passed.
 * Development fixture mode has no session or database and reads sample records.
 */
export function getDashboards(): Promise<OwnedRecordSummary[]> {
  return loadRecordSummaries('dashboards', DASHBOARD_FIXTURES);
}
