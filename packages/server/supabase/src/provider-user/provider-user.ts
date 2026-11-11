import { identityFailure, withDeadline } from '../auth-errors';
import type { ProviderFailure } from '../provider-failure';
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
 * Only an answered "no session" (a missing session, an invalid token, or a 4xx
 * refusal with a code such as `user_not_found`) is signed out. A rate limit,
 * an unexplained error, an outage, a thrown value and no answer within the
 * shared deadline are `unavailable`, so the host tells a person to sign in
 * again only for a rejected session. A failure carries the code and status
 * only, never the error, its message or the session.
 */
export async function readProviderUser(
  client: SupabaseServerClient,
): Promise<ProviderUserResult> {
  try {
    const response = await withDeadline(() => client.auth.getUser());
    if (response === 'deadline') {
      return { kind: 'unavailable', failure: { code: 'timeout' } };
    }
    const { data, error } = response;
    if (error) return identityFailure(error);
    if (data.user) return { kind: 'user', user: data.user };
    return { kind: 'signed-out', failure: {} };
  } catch (thrown) {
    return identityFailure(thrown);
  }
}
