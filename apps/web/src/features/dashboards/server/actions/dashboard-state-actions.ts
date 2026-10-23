'use server';

import { z } from 'zod';

import {
  getCaller,
  logFailure,
  SAVE_FAILED,
} from '@/features/account/server/caller';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import {
  setOwnedRecordPinned,
  type SetRecordPinnedResult,
} from '@/lib/owned-records';
import { createClient } from '@/lib/supabase/server';

const idSchema = z.uuid();

/**
 * Pins or unpins one of the caller's dashboards. The browser asks for a change;
 * the database stamps the time. Row-level security limits the write to the
 * caller's own dashboards.
 */
export async function setDashboardPinned(
  dashboardId: unknown,
  pinned: unknown,
): Promise<SetRecordPinnedResult> {
  if (fixtureModeEnabled()) return { ok: false, error: FIXTURE_MESSAGE };
  const id = idSchema.safeParse(dashboardId);
  if (!id.success || typeof pinned !== 'boolean') {
    return { ok: false, error: SAVE_FAILED };
  }

  const supabase = await createClient();
  const found = await getCaller(supabase);
  if (!('caller' in found)) {
    return { ok: false, error: found.failure, signedOut: found.signedOut };
  }

  const result = await setOwnedRecordPinned(
    supabase,
    'dashboards',
    id.data,
    pinned,
  );
  if (!result.ok) {
    logFailure(
      'setDashboardPinned',
      result.error as Parameters<typeof logFailure>[1],
    );
    return { ok: false, error: SAVE_FAILED };
  }
  return result;
}
