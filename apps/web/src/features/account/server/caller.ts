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

export const SIGN_IN_AGAIN = 'Sign in again to update your profile.';
export const SAVE_FAILED = 'Could not save your changes. Try again.';
export const SHOWS_LATER = 'It may take a little while to show everywhere.';

/**
 * The verified caller from their own session, or `null`. Every profile action
 * acts on this user only, so there is no user id to forge.
 */
export async function getCaller(supabase: Supabase): Promise<Caller | null> {
  const { data, error } = await supabase.auth.getUser();
  return error || !data.user ? null : data.user;
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
  if (updateError) return false;
  const { error: refreshError } = await supabase.auth.refreshSession();
  return !refreshError;
}
