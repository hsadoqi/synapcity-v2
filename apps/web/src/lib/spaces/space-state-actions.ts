'use server';

import { revalidatePath } from 'next/cache';

import { getCallerIdentity, SAVE_FAILED } from '@/lib/access/caller';
import { logFailure } from '@/lib/log-failure';
import { getVerifiedIdentity } from '@/features/auth/server/session';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { homePathFor } from '@/lib/routing/user-paths';
import { createClient } from '@/lib/supabase/server';

import type {
  AddToSpaceResult,
  SetSpacePinnedResult,
} from '@synapcity/features-spaces/contracts';
import { serverSpaceSource } from '@synapcity/features-spaces/server';
import { z } from 'zod';

const recordIdSchema = z.uuid();

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

/**
 * Adds one of the caller's documents or dashboards to one of their spaces.
 * Both ids come from the browser, so both are checked, and the caller is
 * verified with a fresh lookup (ADR-0006), as this is a write. Row-level
 * security decides the rest: someone else's space or item is refused, and
 * reads the same as one that does not exist. Adding an item that is already
 * there succeeds and changes nothing.
 */
async function addToSpace(
  kind: 'document' | 'dashboard',
  spaceId: unknown,
  itemId: unknown,
): Promise<AddToSpaceResult> {
  if (fixtureModeEnabled()) return { ok: false, error: FIXTURE_MESSAGE };
  const space = recordIdSchema.safeParse(spaceId);
  const item = recordIdSchema.safeParse(itemId);
  if (!space.success || !item.success) return { ok: false, error: SAVE_FAILED };

  const supabase = await createClient();
  const found = await getCallerIdentity(supabase);
  if (!('identity' in found)) {
    return {
      ok: false,
      error: found.failure,
      ...(found.signedOut && { signedOut: true }),
    };
  }

  const source = serverSpaceSource(supabase);
  const outcome =
    kind === 'document'
      ? await source.addDocument(space.data, item.data)
      : await source.addDashboard(space.data, item.data);
  if (!outcome.ok) {
    logFailure('addToSpace', outcome.error, { kind });
    // Without a code the request was cut off and the row may exist; refresh
    // so it shows if it does. Retrying is safe either way.
    if (!outcome.error.code) revalidateHome(found.identity.userId);
    return { ok: false, error: SAVE_FAILED };
  }

  revalidateHome(found.identity.userId);
  return { ok: true };
}

/**
 * The caller's home area: the space's page and the spaces index (item lists
 * and counts), the documents and dashboards indexes (how many spaces each is
 * in), and the sidebar, which lists spaces with their counts. Settings and
 * other people's pages are left alone.
 */
function revalidateHome(userId: string) {
  revalidatePath(homePathFor(userId), 'layout');
}

/** Adds one of the caller's documents to one of their spaces (see `addToSpace`). */
export async function addDocumentToSpace(
  spaceId: unknown,
  documentId: unknown,
): Promise<AddToSpaceResult> {
  return addToSpace('document', spaceId, documentId);
}

/** Adds one of the caller's dashboards to one of their spaces (see `addToSpace`). */
export async function addDashboardToSpace(
  spaceId: unknown,
  dashboardId: unknown,
): Promise<AddToSpaceResult> {
  return addToSpace('dashboard', spaceId, dashboardId);
}
