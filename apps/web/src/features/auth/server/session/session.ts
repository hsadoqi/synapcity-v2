import type { IdentityResult } from '@synapcity/domain-identity/types';
import { verifyIdentity } from '@synapcity/server-auth';
import { outcomeFromClaims } from '@synapcity/server-supabase';
import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';
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
 * Verified JWT claims for this request, or null when signed out. `cache`
 * memoizes per request, so the layout, header and page share one verification
 * instead of repeating it (ADR-0006: `getClaims`, never `getSession`).
 */
export const getVerifiedClaims = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
});

/**
 * Who the verified caller is, through the identity boundary, for deciding
 * access. It reads the same memoized claims as `getVerifiedClaims`, so a
 * request still verifies its token once. Development fixture mode never
 * changes it: a fixture is not a verified identity (ADR-0006).
 */
export const getVerifiedIdentity = cache(async (): Promise<IdentityResult> => {
  const verification = await verifyIdentity({
    claims: async () => outcomeFromClaims(await getVerifiedClaims()),
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
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
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
