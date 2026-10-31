import type { AuthChangeEvent } from '@supabase/supabase-js';

/**
 * Whether an auth event from the browser client means the server-rendered
 * user is out of date. The session cookie stays the source of truth, so the
 * response is a `router.refresh()`, never copying the session into state.
 *
 * `SIGNED_IN` fires again when a tab regains focus, so it only counts when the
 * user actually differs. `INITIAL_SESSION` fires on subscribe and
 * `TOKEN_REFRESHED` never changes who is signed in.
 */
export function shouldRefreshOnAuthEvent(
  event: AuthChangeEvent,
  sessionUserId: string | null,
  knownUserId: string | null,
): boolean {
  switch (event) {
    case 'SIGNED_OUT':
      return knownUserId !== null;
    case 'SIGNED_IN':
      return sessionUserId !== knownUserId;
    case 'USER_UPDATED':
      return true;
    default:
      return false;
  }
}
