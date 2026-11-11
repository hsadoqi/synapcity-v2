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
  // The form edits the display name, so it starts from the raw value, never
  // from the resolved name (which may be the first name).
  const { displayName, imageUrl } = profileFromClaims(claims);

  return (
    <WelcomeCard
      completeProfile={completeProfile}
      skipProfileSetup={skipProfileSetup}
      defaultName={displayName ?? ''}
      imageUrl={imageUrl}
      next={next}
    />
  );
}
