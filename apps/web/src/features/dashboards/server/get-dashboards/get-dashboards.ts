import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import {
  listOwnedRecordSummaries,
  type OwnedRecordSummary,
} from '@/lib/owned-records';
import { createClient } from '@/lib/supabase/server';

import { DASHBOARD_FIXTURES } from '../../lib/fixtures';

/**
 * The signed-in owner's dashboards with how many spaces each is in. Row-level
 * security scopes the query to the session, so no owner id is passed.
 * Development fixture mode has no session or database and reads sample records.
 */
export async function getDashboards(): Promise<OwnedRecordSummary[]> {
  if (fixtureModeEnabled()) return [...DASHBOARD_FIXTURES];

  return listOwnedRecordSummaries(await createClient(), 'dashboards');
}
