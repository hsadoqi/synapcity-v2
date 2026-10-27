import { mirrorToSession as mirrorProfileToSession } from '@synapcity/server-account';
import {
  readProviderUser,
  type MetadataPatch,
  type ProviderUser,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

import { SAVE_FAILED, SIGN_IN_AGAIN } from '@/lib/access/caller';
import { logFailure } from '@/lib/log-failure';

/** What the profile actions need to know about the signed-in user. */
export type Caller = ProviderUser;

export type { MetadataPatch };

export const SHOWS_LATER = 'It may take a little while to show everywhere.';

/** Who is asking, or the message to show instead. */
export type CallerResult =
  { caller: Caller } | { failure: string; signedOut?: true };

/**
 * The verified caller from their own session, with the provider's user record
 * the profile actions edit. Every profile action acts on this user only, so
 * there is no user id to forge.
 *
 * A dropped connection is not a signed-out session: telling someone to sign in
 * again during an outage sends them to a sign-in that cannot work either, so
 * the two get different messages.
 */
export async function getCaller(
  supabase: SupabaseServerClient,
): Promise<CallerResult> {
  const found = await readProviderUser(supabase);
  if (found.kind === 'user') return { caller: found.user };
  logFailure('getCaller', found.failure);
  if (found.kind === 'unavailable') return { failure: SAVE_FAILED };
  return { failure: SIGN_IN_AGAIN, signedOut: true };
}

/**
 * Mirrors profile changes into the token claims the header reads, then
 * refreshes the token (the package explains why). Logs the step that failed,
 * by code and status only, and returns whether both steps worked.
 */
export async function mirrorToSession(
  supabase: SupabaseServerClient,
  caller: Caller,
  patches: MetadataPatch[],
): Promise<boolean> {
  const mirrored = await mirrorProfileToSession(supabase, caller, patches);
  if (!mirrored.ok) {
    logFailure(`mirrorToSession.${mirrored.step}`, mirrored.failure);
  }
  return mirrored.ok;
}
