import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

import {
  currentUserFromClaims,
  type CurrentUser,
} from '@/features/auth/shared/current-user';

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

/**
 * The address a pending email change is waiting on, or null. The token's
 * claims do not carry it, so this asks the provider (a network call): use it
 * only where it is shown, not on every page.
 */
export const getPendingEmail = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.new_email ?? null;
});
