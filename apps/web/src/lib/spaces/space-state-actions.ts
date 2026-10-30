'use server';

import { getCallerIdentity, SAVE_FAILED } from '@/lib/access/caller';
import { logFailure } from '@/lib/log-failure';
import { getVerifiedIdentity } from '@/features/auth/server/session';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { createClient } from '@/lib/supabase/server';

import { recordIdSchema } from '@synapcity/domain-records';
import type { SetSpacePinnedResult } from '@synapcity/features-spaces/contracts';
import { serverSpaceSource } from '@synapcity/features-spaces/server';

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
  const id = recordIdSchema.safeParse(spaceId);
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
    logFailure('setSpacePinned', outcome.error);
    return { ok: false, error: SAVE_FAILED };
  }
  return { ok: true, pinnedAt: outcome.pinnedAt };
}

/**
 * Notes that the caller opened one of their spaces. The write skips a view
 * recorded under a minute ago, and a failure is logged, never reported to the
 * person: a view that was not recorded is not worth interrupting them for.
 *
 * The caller is checked from the session claims, not with a fresh provider
 * lookup (ADR-0006 exception): this runs on every Space open, and the write is
 * a timestamp that row-level security already limits to the caller's own
 * rows. A revoked session can at most stamp its own row until its token
 * expires. Pins keep the fresh lookup.
 */
export async function recordSpaceView(spaceId: unknown): Promise<void> {
  if (fixtureModeEnabled()) return;
  const id = recordIdSchema.safeParse(spaceId);
  if (!id.success) return;

  if ((await getVerifiedIdentity()).status !== 'verified') return;

  const outcome = await serverSpaceSource(await createClient()).recordView(
    id.data,
  );
  if (!outcome.ok) logFailure('recordSpaceView', outcome.error);
}
