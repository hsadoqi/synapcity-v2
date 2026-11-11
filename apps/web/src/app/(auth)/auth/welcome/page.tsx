import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import {
  completeProfile,
  skipProfileSetup,
} from '@/features/account/server/actions/setup-actions';
import { WelcomeCard } from './welcome-card';
import { getVerifiedClaims } from '@/features/auth/server';
import { profileFromClaims } from '@synapcity/server-supabase/claims';
import { welcomePath } from '@/lib/routing/auth-flow';
import { safeNextPath } from '@/lib/routing/safe-next';
import { homePathFor } from '@/lib/routing/user-paths';
import { createClient } from '@/lib/supabase/server';
import { readProfileSetup } from '@synapcity/server-account';

/**
 * A first name the provider gave explicitly (`given_name`, which Google sends
 * and GitHub does not). It only prefills the field: nothing is saved until
 * the person submits. A full name is never split into a first name.
 */
function providerGivenName(
  metadata: Record<string, unknown> | undefined,
): string {
  const value = metadata?.given_name;
  return typeof value === 'string' ? value.trim() : '';
}

export const metadata: Metadata = { title: 'Welcome' };

/**
 * Where a brand-new account confirms its name and photo, then carries on. The
 * callback sends people here after a sign-up or provider sign-in; see
 * `needsProfileSetup`. Opening it by hand is harmless: it is just the same
 * edit the settings page offers.
 */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const requested = (await searchParams).next;
  const claims = await getVerifiedClaims();

  if (!claims) {
    // Sign in first, then come back here and carry on to the same place.
    const back = welcomePath(safeNextPath(requested, '/'));
    redirect(`/auth/login?next=${encodeURIComponent(back)}`);
  }

  const next = safeNextPath(requested, homePathFor(claims.sub));
  // The names come from the profile row, which holds the record. The display
  // name field starts from the raw value, never from the resolved name (which
  // may be the first name). The picture is the one the token carries.
  const { imageUrl } = profileFromClaims(claims);
  const profile = await readProfileSetup(await createClient(), claims.sub);
  const stored = profile.kind === 'found' ? profile : null;

  return (
    <WelcomeCard
      completeProfile={completeProfile}
      skipProfileSetup={skipProfileSetup}
      defaultFirstName={
        stored?.firstName ?? providerGivenName(claims.user_metadata)
      }
      defaultLastName={stored?.lastName ?? ''}
      defaultName={stored?.displayName ?? ''}
      imageUrl={imageUrl}
      next={next}
    />
  );
}
