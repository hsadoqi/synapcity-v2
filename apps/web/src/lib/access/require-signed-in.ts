import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { REQUEST_PATH_HEADER } from '../routing/request-path';
import { safeNextPath } from '../routing/safe-next';
import { signInHref } from '../routing/sign-in-href';
import { fixtureModeEnabled } from './dev-fixture';
import {
  AuthUnavailableError,
  getClaimsResult,
} from '../../features/auth/server/session';

/**
 * Guards the `(protected)` route group: someone must be signed in. It does not
 * check *who*; pages under `[userId]` still call `requireOwner` for that.
 *
 * This is a backstop for any page added to the group, not the only check. The
 * session proxy already redirects with `?next=`, and layouts are not
 * re-rendered on every navigation, so each page checks for itself too. A
 * layout cannot read the request path, so it takes it from the header the
 * proxy sets (`REQUEST_PATH_HEADER`); that matters for the bare `/<userId>`,
 * which the proxy does not match. It reads the same memoized claims as
 * `requireOwner`, so a request still verifies its token once.
 */
export async function requireSignedIn(): Promise<void> {
  if (fixtureModeEnabled()) return;

  const result = await getClaimsResult();
  // An outage is not a sign-out: do not send someone who may be signed in away.
  if (result.status === 'unavailable') throw new AuthUnavailableError();
  if (result.status === 'signed-out') redirect(await signedOutDestination());
}

/** Sign in, with the page the visitor asked for as the way back when it is known and safe. */
async function signedOutDestination(): Promise<string> {
  let requested: string | null = null;
  try {
    requested = (await headers()).get(REQUEST_PATH_HEADER);
  } catch {
    // Outside a request there is no path to return to.
  }
  const back = safeNextPath(requested, '');
  return back ? signInHref(back) : '/auth/login';
}
