import {
  toProviderFailure,
  type ProviderFailure,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

import { setRecordPinned, type PinnedOutcome } from '../../records';

/** A view recorded less than this long ago is not recorded again. */
const VIEW_THROTTLE_MS = 60_000;

/** Pins or unpins one of the caller's spaces (see `setRecordPinned`). */
export function setSpacePinned(
  client: SupabaseServerClient,
  spaceId: string,
  pinned: boolean,
): Promise<PinnedOutcome> {
  return setRecordPinned(client, 'spaces', spaceId, pinned);
}

/**
 * Notes that the caller opened one of their spaces. Skipped when the last view
 * was under a minute ago. The outcome carries the error so the host can log it;
 * a view that was not recorded is not worth interrupting anyone for.
 */
export async function recordSpaceView(
  client: SupabaseServerClient,
  spaceId: string,
  now: Date,
): Promise<{ ok: true } | { ok: false; error: ProviderFailure }> {
  const cutoff = new Date(now.getTime() - VIEW_THROTTLE_MS).toISOString();
  const { error } = await client
    .from('spaces')
    .update({ last_viewed_at: now.toISOString() })
    .eq('id', spaceId)
    .or(`last_viewed_at.is.null,last_viewed_at.lt.${cutoff}`);

  return error ? { ok: false, error: toProviderFailure(error) } : { ok: true };
}
