'use server';

import { z } from 'zod';

import {
  getCaller,
  logFailure,
  SAVE_FAILED,
} from '@/features/account/server/caller';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { createClient } from '@/lib/supabase/server';

import type { SetSpacePinnedResult } from '../../shared/types';

const spaceIdSchema = z.uuid();

/** A view recorded less than this long ago is not recorded again. */
const VIEW_THROTTLE_MS = 60_000;

/**
 * Pins or unpins one of the caller's spaces. The browser asks for a change; the
 * database stamps the time, so `pinnedAt` in the result is the server's own.
 * Row-level security limits the write to the caller's own spaces, and `select`
 * returns the written row so a write it turned away cannot look saved.
 */
export async function setSpacePinned(
  spaceId: unknown,
  pinned: unknown,
): Promise<SetSpacePinnedResult> {
  if (fixtureModeEnabled()) return { ok: false, error: FIXTURE_MESSAGE };
  const id = spaceIdSchema.safeParse(spaceId);
  if (!id.success || typeof pinned !== 'boolean') {
    return { ok: false, error: SAVE_FAILED };
  }

  const supabase = await createClient();
  const found = await getCaller(supabase);
  if (!('caller' in found)) {
    return { ok: false, error: found.failure, signedOut: found.signedOut };
  }

  const { data, error } = await supabase
    .from('spaces')
    // Any non-null value means "pin"; the database replaces it with its clock.
    .update({ pinned_at: pinned ? new Date().toISOString() : null })
    .eq('id', id.data)
    .select('pinned_at');
  if (error || !data?.length) {
    logFailure('setSpacePinned', error ?? { code: 'row_not_written' });
    return { ok: false, error: SAVE_FAILED };
  }
  return { ok: true, pinnedAt: data[0]?.pinned_at ?? null };
}

/**
 * Notes that the caller opened one of their spaces. It is skipped when the last
 * view was under a minute ago, and it never reports a failure to the person:
 * a view that was not recorded is not worth interrupting them for.
 */
export async function recordSpaceView(spaceId: unknown): Promise<void> {
  if (fixtureModeEnabled()) return;
  const id = spaceIdSchema.safeParse(spaceId);
  if (!id.success) return;

  const supabase = await createClient();
  const found = await getCaller(supabase);
  if (!('caller' in found)) return;

  const now = Date.now();
  const cutoff = new Date(now - VIEW_THROTTLE_MS).toISOString();
  const { error } = await supabase
    .from('spaces')
    .update({ last_viewed_at: new Date(now).toISOString() })
    .eq('id', id.data)
    .or(`last_viewed_at.is.null,last_viewed_at.lt.${cutoff}`);
  if (error) logFailure('recordSpaceView', error);
}
