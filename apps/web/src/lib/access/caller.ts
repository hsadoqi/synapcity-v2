import type { VerifiedIdentity } from '@synapcity/domain-identity/types';
import { verifyIdentityWithProvider } from '@synapcity/server-auth';
import {
  supabaseIdentityProvider,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

import { logFailure } from '../log-failure';

export const SIGN_IN_AGAIN = 'Sign in again to update your profile.';
export const SAVE_FAILED = 'Could not save your changes. Try again.';

/** Who is asking, through the identity boundary, or the message to show instead. */
export type CallerIdentityResult =
  { identity: VerifiedIdentity } | { failure: string; signedOut?: true };

/**
 * The verified caller for Server Actions that need only who is asking, checked
 * through the identity boundary with a fresh provider lookup (ADR-0006). An
 * outage gets "try again", anything else asks the person to sign in again, and
 * every failure is logged by code and status only.
 */
export async function getCallerIdentity(
  supabase: SupabaseServerClient,
): Promise<CallerIdentityResult> {
  const { result, failure } = await verifyIdentityWithProvider(
    supabaseIdentityProvider(supabase),
  );
  if (result.status === 'verified') return { identity: result.identity };
  logFailure('getCallerIdentity', failure);
  if (result.status === 'unavailable') return { failure: SAVE_FAILED };
  return { failure: SIGN_IN_AGAIN, signedOut: true };
}
