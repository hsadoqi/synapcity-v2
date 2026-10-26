'use server';

import { z } from 'zod';

import {
  getCallerIdentity,
  logFailure,
  SAVE_FAILED,
} from '@/features/account/server/caller';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { createClient } from '@/lib/supabase/server';

import type { SetDashboardPinnedResult } from '@synapcity/features-dashboards/contracts';
import { setDashboardPinned as writeDashboardPinned } from '@synapcity/server-data';

const idSchema = z.uuid();

/**
 * Pins or unpins one of the caller's dashboards. The browser asks for a change;
 * the database stamps the time. Row-level security limits the write to the
 * caller's own dashboards.
 */
export async function setDashboardPinned(
  dashboardId: unknown,
  pinned: unknown,
): Promise<SetDashboardPinnedResult> {
  if (fixtureModeEnabled()) return { ok: false, error: FIXTURE_MESSAGE };
  const id = idSchema.safeParse(dashboardId);
  if (!id.success || typeof pinned !== 'boolean') {
    return { ok: false, error: SAVE_FAILED };
  }

  const supabase = await createClient();
  const found = await getCallerIdentity(supabase);
  if (!('identity' in found)) {
    return { ok: false, error: found.failure, signedOut: found.signedOut };
  }

  const result = await writeDashboardPinned(supabase, id.data, pinned);
  if (!result.ok) {
    logFailure('setDashboardPinned', result.error as { code?: string });
    return { ok: false, error: SAVE_FAILED };
  }
  return result;
}
