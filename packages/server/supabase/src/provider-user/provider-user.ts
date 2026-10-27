import { isAuthRetryableFetchError } from '@supabase/supabase-js';

import { toProviderFailure, type ProviderFailure } from '../provider-failure';
import type { SupabaseServerClient } from '../request-client';

/** What profile operations need to know about the signed-in user. */
export type ProviderUser = {
  id: string;
  email?: string | null;
  /** The address a pending email change is waiting on. */
  new_email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  identities?:
    | { provider?: string; identity_data?: Record<string, unknown> | null }[]
    | null;
};

/** Changes the metadata sent to `auth.updateUser`; patches compose in order. */
export type MetadataPatch = (
  existing: Record<string, unknown> | null | undefined,
) => Record<string, unknown>;

export type ProviderUserResult =
  | { kind: 'user'; user: ProviderUser }
  | { kind: 'signed-out'; failure: ProviderFailure }
  | { kind: 'unavailable'; failure: ProviderFailure };

/**
 * Reads the user record for the caller's own session from the provider.
 *
 * A dropped connection is not a signed-out session, so the two are different
 * outcomes: the host tells a person to sign in again only for a rejected
 * session. A failure carries the code and status only, never the error, its
 * message or the session.
 */
export async function readProviderUser(
  client: SupabaseServerClient,
): Promise<ProviderUserResult> {
  const { data, error } = await client.auth.getUser();
  if (!error && data.user) return { kind: 'user', user: data.user };
  const failure: ProviderFailure = error ? toProviderFailure(error) : {};
  if (isAuthRetryableFetchError(error)) return { kind: 'unavailable', failure };
  return { kind: 'signed-out', failure };
}
