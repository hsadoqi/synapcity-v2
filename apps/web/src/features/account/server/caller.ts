import type { VerifiedIdentity } from '@synapcity/domain-identity/types';
import { mirrorToSession as mirrorProfileToSession } from '@synapcity/server-account';
import { verifyIdentityWithProvider } from '@synapcity/server-auth';
import {
  readProviderUser,
  supabaseIdentityProvider,
  type MetadataPatch,
  type ProviderUser,
} from '@synapcity/server-supabase';

import { createClient } from '@/lib/supabase/server';

export type Supabase = Awaited<ReturnType<typeof createClient>>;

/** What the profile actions need to know about the signed-in user. */
export type Caller = ProviderUser;

export type { MetadataPatch };

const SIGN_IN_AGAIN = 'Sign in again to update your profile.';
export const SAVE_FAILED = 'Could not save your changes. Try again.';
export const SHOWS_LATER = 'It may take a little while to show everywhere.';

/** Who is asking, or the message to show instead. */
export type CallerResult =
  { caller: Caller } | { failure: string; signedOut?: true };

/**
 * The verified caller from their own session. Every profile action acts on
 * this user only, so there is no user id to forge.
 *
 * A dropped connection is not a signed-out session: telling someone to sign in
 * again during an outage sends them to a sign-in that cannot work either, so
 * the two get different messages.
 */
export async function getCaller(supabase: Supabase): Promise<CallerResult> {
  const found = await readProviderUser(supabase);
  if (found.kind === 'user') return { caller: found.user };
  logFailure('getCaller', found.failure);
  if (found.kind === 'unavailable') return { failure: SAVE_FAILED };
  return { failure: SIGN_IN_AGAIN, signedOut: true };
}

/** Who is asking, through the identity boundary, or the message to show instead. */
export type CallerIdentityResult =
  { identity: VerifiedIdentity } | { failure: string; signedOut?: true };

/**
 * The verified caller for actions that need only who is asking, checked
 * through the identity boundary with a fresh provider lookup (ADR-0006).
 * Replies and logging match `getCaller`: an outage gets "try again", anything
 * else asks the person to sign in again, and every failure is logged by code
 * and status only. Profile actions that need the provider's user record keep
 * `getCaller` until Milestone 7.
 */
export async function getCallerIdentity(
  supabase: Supabase,
): Promise<CallerIdentityResult> {
  const { result, failure } = await verifyIdentityWithProvider(
    supabaseIdentityProvider(supabase),
  );
  if (result.status === 'verified') return { identity: result.identity };
  logFailure('getCallerIdentity', failure);
  if (result.status === 'unavailable') return { failure: SAVE_FAILED };
  return { failure: SIGN_IN_AGAIN, signedOut: true };
}

/**
 * Records that an operation failed, by code only. The error object, its
 * message, the session and the person's details never reach the logs, so a
 * failure can be traced without leaking any of them.
 */
export function logFailure(
  operation: string,
  error: { code?: string; status?: number } | null | undefined,
): void {
  console.warn(`${operation} failed`, {
    code: error?.code,
    status: error?.status,
  });
}

/**
 * Mirrors profile changes into the token claims the header reads, then
 * refreshes the token (the package explains why). Logs the step that failed,
 * by code and status only, and returns whether both steps worked.
 */
export async function mirrorToSession(
  supabase: Supabase,
  caller: Caller,
  patches: MetadataPatch[],
): Promise<boolean> {
  const mirrored = await mirrorProfileToSession(supabase, caller, patches);
  if (!mirrored.ok) {
    logFailure(`mirrorToSession.${mirrored.step}`, mirrored.failure);
  }
  return mirrored.ok;
}
