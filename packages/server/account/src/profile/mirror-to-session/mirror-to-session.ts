import type {
  MetadataPatch,
  ProviderFailure,
  ProviderUser,
  SupabaseServerClient,
} from '@synapcity/server-supabase';

export type SessionMirrored =
  | { ok: true }
  | {
      ok: false;
      step: 'updateUser' | 'refreshSession';
      failure: ProviderFailure;
    };

/**
 * Mirrors profile changes into the token claims the header reads, then
 * refreshes the token. `updateUser` keeps the old access token, and the header
 * reads the name and picture from its claims, so without the refresh the old
 * ones show for up to an hour. The outcome says which step failed, by code and
 * status only; the host logs it.
 */
export async function mirrorToSession(
  client: SupabaseServerClient,
  user: ProviderUser,
  patches: MetadataPatch[],
): Promise<SessionMirrored> {
  const data = patches.reduce<Record<string, unknown>>(
    (metadata, patch) => patch(metadata),
    { ...user.user_metadata },
  );
  const { error: updateError } = await client.auth.updateUser({ data });
  if (updateError) {
    return {
      ok: false,
      step: 'updateUser',
      failure: { code: updateError.code, status: updateError.status },
    };
  }
  const { error: refreshError } = await client.auth.refreshSession();
  if (refreshError) {
    return {
      ok: false,
      step: 'refreshSession',
      failure: { code: refreshError.code, status: refreshError.status },
    };
  }
  return { ok: true };
}
