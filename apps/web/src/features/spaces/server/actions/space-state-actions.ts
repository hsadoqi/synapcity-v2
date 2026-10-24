'use server';

import { z } from 'zod';

import {
  getCallerIdentity,
  logFailure,
  SAVE_FAILED,
} from '@/features/account/server/caller';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { createClient } from '@/lib/supabase/server';

import type { SetSpacePinnedResult } from '../../shared/types';
import { serverSpaceSource } from '../space-source';

const spaceIdSchema = z.uuid();

/**
 * Pins or unpins one of the caller's spaces. The browser asks for a change; the
 * database stamps the time, so `pinnedAt` in the result is the server's own.
 * Row-level security limits the write to the caller's own spaces, and a write
 * it turned away is reported as a failure, never as saved.
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
  const found = await getCallerIdentity(supabase);
  if (!('identity' in found)) {
    return { ok: false, error: found.failure, signedOut: found.signedOut };
  }

  const outcome = await serverSpaceSource(supabase).setPinned(id.data, pinned);
  if (!outcome.ok) {
    logFailure('setSpacePinned', outcome.error as { code?: string });
    return { ok: false, error: SAVE_FAILED };
  }
  return { ok: true, pinnedAt: outcome.pinnedAt };
}

/**
 * Notes that the caller opened one of their spaces. The write skips a view
 * recorded under a minute ago, and a failure is logged, never reported to the
 * person: a view that was not recorded is not worth interrupting them for.
 */
export async function recordSpaceView(spaceId: unknown): Promise<void> {
  if (fixtureModeEnabled()) return;
  const id = spaceIdSchema.safeParse(spaceId);
  if (!id.success) return;

  const supabase = await createClient();
  const found = await getCallerIdentity(supabase);
  if (!('identity' in found)) return;

  const outcome = await serverSpaceSource(supabase).recordView(id.data);
  if (!outcome.ok)
    logFailure('recordSpaceView', outcome.error as { code?: string });
}
