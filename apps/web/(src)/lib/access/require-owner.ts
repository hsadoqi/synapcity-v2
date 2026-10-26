import { isOwner } from '@synapcity/server-auth';
import { notFound, redirect } from 'next/navigation';

import { homePathFor } from '../routing/user-paths';
import {
  fixtureClaims,
  fixtureModeEnabled,
  FIXTURE_USER_ID,
} from './dev-fixture';
import {
  getVerifiedClaims,
  getVerifiedIdentity,
} from '../../../src/features/auth/server/session';

type Claims = NonNullable<Awaited<ReturnType<typeof getVerifiedClaims>>>;

/**
 * Who may see an owner-area page. `fixture` access is development-only,
 * carries no session and must never authorize a mutation.
 */
export type OwnerAccess =
  | { kind: 'verified'; claims: Claims }
  | { kind: 'fixture'; claims: typeof fixtureClaims };

/**
 * Guards a `/[userId]/...` route: the visitor must be signed in AND be that
 * user. The id in the URL is untrusted input, never proof of who is asking.
 *
 * Call it from the layout and from each page. Layouts are not re-rendered on
 * every navigation, so a layout alone is not a safe place for the check.
 * Someone else's id is a 404 rather than a 403, so ids are not confirmed.
 *
 * In development fixture mode the fixture user's own id is let through, marked
 * as fixture access; every other id is still a 404.
 */
export async function requireOwner(userId: string): Promise<OwnerAccess> {
  if (fixtureModeEnabled()) {
    if (userId !== FIXTURE_USER_ID) notFound();
    return { kind: 'fixture', claims: fixtureClaims };
  }

  const identity = await getVerifiedIdentity();

  if (identity.status !== 'verified') {
    redirect(`/auth/login?next=${encodeURIComponent(homePathFor(userId))}`);
  }
  if (!isOwner(identity, userId)) notFound();

  // Display readers (the settings page) still need the provider's claims
  // until Milestone 7; this is the same memoized read, not a second check.
  const claims = await getVerifiedClaims();
  if (!claims) notFound();

  return { kind: 'verified', claims };
}
