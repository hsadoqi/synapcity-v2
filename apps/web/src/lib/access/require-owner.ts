import { notFound, redirect } from 'next/navigation';

import { homePathFor } from '../routing/user-paths';
import { getVerifiedClaims } from '../../features/auth/server/session';

/**
 * Guards a `/[userId]/...` route: the visitor must be signed in AND be that
 * user. The id in the URL is untrusted input, never proof of who is asking.
 *
 * Call it from the layout and from each page. Layouts are not re-rendered on
 * every navigation, so a layout alone is not a safe place for the check.
 * Someone else's id is a 404 rather than a 403, so ids are not confirmed.
 */
export async function requireOwner(userId: string) {
  const claims = await getVerifiedClaims();

  if (!claims) {
    redirect(`/auth/login?next=${encodeURIComponent(homePathFor(userId))}`);
  }
  if (claims.sub !== userId) notFound();

  return claims;
}
