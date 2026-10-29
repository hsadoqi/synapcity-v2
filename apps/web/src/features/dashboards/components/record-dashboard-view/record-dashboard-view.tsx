'use client';

import { useEffect } from 'react';

/**
 * Records that the dashboard was opened, once per visit, after the page has
 * rendered. The write is a Server Action (throttled, failures only logged);
 * it never delays or changes what the person sees.
 */
export function RecordDashboardView({
  dashboardId,
  record,
}: {
  dashboardId: string;
  record: (dashboardId: string) => Promise<void>;
}) {
  useEffect(() => {
    void record(dashboardId).catch(() => {});
  }, [dashboardId, record]);
  return null;
}
