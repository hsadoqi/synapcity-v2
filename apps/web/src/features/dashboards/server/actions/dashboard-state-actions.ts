'use server';

import { setRecordPinnedFor, type SetRecordPinnedResult } from '@/lib/records';

/**
 * Pins or unpins one of the caller's dashboards. The browser asks for a change;
 * the database stamps the time. Row-level security limits the write to the
 * caller's own dashboards.
 */
export async function setDashboardPinned(
  dashboardId: unknown,
  pinned: unknown,
): Promise<SetRecordPinnedResult> {
  return setRecordPinnedFor(
    'dashboards',
    'setDashboardPinned',
    dashboardId,
    pinned,
  );
}
