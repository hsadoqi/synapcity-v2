import type { IdentityResult } from '@synapcity/domain-identity/types';
import { verifyIdentity } from '@synapcity/server-auth';
import {
  outcomeFromClaims,
  readProviderUser,
} from '@synapcity/server-supabase';
import {
  readClaims,
  type ClaimsResult,
} from '@synapcity/server-supabase/claims';
import { headers } from 'next/headers';
import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';
import { AUTH_UNAVAILABLE_HEADER } from '@/lib/routing/auth-unavailable';
import { fixtureModeEnabled, fixtureUser } from '@/lib/access/dev-fixture';
import {
  connectedAccountsFrom,
  type ConnectedAccount,
} from '@synapcity/features-auth/contracts';

import {
  currentUserFromClaims,
  type CurrentUser,
} from '@synapcity/domain-identity';

/**
 * Thrown by a page guard when the Auth service cannot answer. It is not a
 * sign-out: sending the person to sign in would read an outage as a lost
 * session. The error boundary shows it; the proxy normally answers first with
 * the unavailable page, so this is the backstop for an outage that starts mid-request.
 */
export class AuthUnavailableError extends Error {
  constructor() {
    super('The Auth service could not be reached.');
    this.name = 'AuthUnavailableError';
  }
}

/**
 * The session check for this request in its three states: verified, signed
 * out, or unavailable (the Auth service did not answer). `cache` memoizes per
 * request, so the layout, header and page share one verification instead of
 * repeating it (ADR-0006: `getClaims`, never `getSession`).
 */
export const getClaimsResult = cache(async (): Promise<ClaimsResult> => {
  // The proxy already found Auth unreachable for this request (it rewrote it to
  // the unavailable page): take that, instead of waiting out the deadline again.
  if (await proxyFoundAuthUnavailable()) {
    return { status: 'unavailable', failure: { code: 'timeout' } };
  }
  return readClaims(await createClient());
});

async function proxyFoundAuthUnavailable(): Promise<boolean> {
  try {
    const h = await headers();
    if (h.get('x-synapcity-request-path')?.includes('/home')) console.error('[TMP] headers on a /home render:', [...h.keys()].filter((k) => k.startsWith('x-')).join(','));
    return h.get(AUTH_UNAVAILABLE_HEADER) === '1';
  } catch {
    // Outside a request there is no proxy to have said anything.
    return false;
  }
}

/**
 * Verified JWT claims for this request, or null when there are none. Null
 * covers both "signed out" and "unavailable": callers that must tell them
 * apart (page guards, route handlers) use `getClaimsResult` or
 * `getVerifiedIdentity`; the rest treat both as "no claims to show".
 */
export const getVerifiedClaims = cache(async () => {
  const result = await getClaimsResult();
  return result.status === 'verified' ? result.claims : null;
});

/**
 * Who the verified caller is, through the identity boundary, for deciding
 * access. It reads the same memoized check as `getClaimsResult`, so a
 * request still verifies its token once. `unavailable` means the Auth service
 * did not answer; it is not a signed-out session. Development fixture mode
 * never changes it: a fixture is not a verified identity (ADR-0006).
 */
export const getVerifiedIdentity = cache(async (): Promise<IdentityResult> => {
  const result = await getClaimsResult();
  if (result.status === 'unavailable') return { status: 'unavailable' };
  const verification = await verifyIdentity({
    claims: async () =>
      outcomeFromClaims(result.status === 'verified' ? result.claims : null),
  });
  return verification.result;
});

/**
 * Display-only view of the signed-in user. Never authorize with it. In
 * development fixture mode it is the fixture user, which is not a session.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (fixtureModeEnabled()) return fixtureUser();
  const claims = await getVerifiedClaims();
  return claims ? currentUserFromClaims(claims) : null;
});

/**
 * The provider's own record of the signed-in user (a network call), shared by
 * everything that needs more than the token's claims carry. Memoized per
 * request, so the settings page asks once however many readers it has.
 * Fixture mode has no provider record, so readers see no pending email and no
 * linked accounts.
 */
const getProviderUser = cache(async () => {
  if (fixtureModeEnabled()) return null;
  const found = await readProviderUser(await createClient());
  return found.kind === 'user' ? found.user : null;
});

/**
 * The address a pending email change is waiting on, or null. The token's
 * claims do not carry it, so this asks the provider: use it only where it is
 * shown, not on every page.
 */
export const getPendingEmail = cache(async (): Promise<string | null> => {
  return (await getProviderUser())?.new_email ?? null;
});

/** The Google and GitHub accounts linked to this one, as display rows. */
export const getConnectedAccounts = cache(
  async (): Promise<ConnectedAccount[]> =>
    connectedAccountsFrom((await getProviderUser())?.identities),
);
