import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

import { currentUserFromClaims, type CurrentUser } from './profile/profile';

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

/** Display-only view of the signed-in user. Never authorize with it. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const claims = await getVerifiedClaims();
  return claims ? currentUserFromClaims(claims) : null;
});
