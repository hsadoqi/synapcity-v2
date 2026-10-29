import { redirect } from 'next/navigation';

import { fixtureModeEnabled } from './dev-fixture';
import { getVerifiedClaims } from '../../features/auth/server/session';

/**
 * Guards the `(protected)` route group: someone must be signed in. It does not
 * check *who*; pages under `[userId]` still call `requireOwner` for that.
 *
 * This is a backstop for any page added to the group, not the only check. The
 * session proxy already redirects with `?next=`, and layouts are not
 * re-rendered on every navigation, so each page checks for itself too. A
 * layout cannot read the request path, so this redirect cannot keep `next`;
 * the bare `/<userId>` page therefore lives outside the group, where its own
 * `requireOwner` sets `next`.
 * It reads the same memoized claims as `requireOwner`, so a request still
 * verifies its token once.
 */
export async function requireSignedIn(): Promise<void> {
  if (fixtureModeEnabled()) return;

  const claims = await getVerifiedClaims();
  if (!claims) redirect('/auth/login');
}
