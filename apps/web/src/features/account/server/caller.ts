import { isAuthRetryableFetchError } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';

export type Supabase = Awaited<ReturnType<typeof createClient>>;

/** What the profile actions need to know about the signed-in user. */
export type Caller = {
  id: string;
  user_metadata?: Record<string, unknown> | null;
  identities?:
    | { provider?: string; identity_data?: Record<string, unknown> | null }[]
    | null;
};

/** Changes the metadata sent to `auth.updateUser`; patches compose in order. */
export type MetadataPatch = (
  existing: Record<string, unknown> | null | undefined,
) => Record<string, unknown>;

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
  const { data, error } = await supabase.auth.getUser();
  if (!error && data.user) return { caller: data.user };
  logFailure('getCaller', error);
  if (isAuthRetryableFetchError(error)) return { failure: SAVE_FAILED };
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
 * refreshes the token. `updateUser` keeps the old access token, and the header
 * reads the name and picture from its claims, so without the refresh the old
 * ones show for up to an hour. Returns whether both steps worked.
 */
export async function mirrorToSession(
  supabase: Supabase,
  caller: Caller,
  patches: MetadataPatch[],
): Promise<boolean> {
  const data = patches.reduce<Record<string, unknown>>(
    (metadata, patch) => patch(metadata),
    { ...caller.user_metadata },
  );
  const { error: updateError } = await supabase.auth.updateUser({ data });
  if (updateError) {
    logFailure('mirrorToSession.updateUser', updateError);
    return false;
  }
  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) logFailure('mirrorToSession.refreshSession', refreshError);
  return !refreshError;
}
