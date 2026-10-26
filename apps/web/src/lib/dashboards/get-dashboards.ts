import type { DashboardSummary } from '@synapcity/domain-dashboards';
import { listDashboardSummaries } from '@synapcity/server-data';

import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { DEMO_DASHBOARDS } from '@/lib/demo/dashboards';
import { createClient } from '@/lib/supabase/server';

/**
 * The signed-in owner's dashboards with how many spaces each is in. Row-level
 * security scopes the query to the session, so no owner id is passed.
 * Development fixture mode has no session or database and reads sample records.
 */
export async function getDashboards(): Promise<DashboardSummary[]> {
  if (fixtureModeEnabled()) return [...DEMO_DASHBOARDS];

  return listDashboardSummaries(await createClient());
}
