import type { SupabaseServerClient } from '@synapcity/server-supabase';

/** A view recorded less than this long ago is not recorded again. */
const VIEW_THROTTLE_MS = 60_000;

/**
 * Pins or unpins one of the caller's spaces. The browser asks for a change; the
 * database stamps the time, so `pinnedAt` in the result is the server's own.
 * Row-level security limits the write to the caller's own spaces, and `select`
 * returns the written row so a write it turned away cannot look saved.
 */
export async function setSpacePinned(
  client: SupabaseServerClient,
  spaceId: string,
  pinned: boolean,
): Promise<
  { ok: true; pinnedAt: string | null } | { ok: false; error: unknown }
> {
  const { data, error } = await client
    .from('spaces')
    // Any non-null value means "pin"; the database replaces it with its clock.
    .update({ pinned_at: pinned ? new Date().toISOString() : null })
    .eq('id', spaceId)
    .select('pinned_at');

  if (error || !data?.length) {
    return { ok: false, error: error ?? { code: 'row_not_written' } };
  }
  return { ok: true, pinnedAt: data[0]?.pinned_at ?? null };
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
): Promise<{ ok: true } | { ok: false; error: unknown }> {
  const cutoff = new Date(now.getTime() - VIEW_THROTTLE_MS).toISOString();
  const { error } = await client
    .from('spaces')
    .update({ last_viewed_at: now.toISOString() })
    .eq('id', spaceId)
    .or(`last_viewed_at.is.null,last_viewed_at.lt.${cutoff}`);

  return error ? { ok: false, error } : { ok: true };
}
