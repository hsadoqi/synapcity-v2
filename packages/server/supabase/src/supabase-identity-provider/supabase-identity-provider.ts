import type { SupabaseClient } from '@supabase/supabase-js';
import type { IdentityProvider, ProviderOutcome } from '@synapcity/server-auth';

import { identityFailure, withDeadline } from '../auth-errors';

/** The part of a Supabase client the identity provider uses. */
type AuthClient = {
  auth: Pick<SupabaseClient['auth'], 'getClaims' | 'getUser'>;
};

/** Already-verified Supabase claims (or none) as a provider outcome. */
export function outcomeFromClaims(
  claims: { sub: string } | null | undefined,
): ProviderOutcome {
  return claims ? { kind: 'user', userId: claims.sub } : { kind: 'none' };
}

/**
 * A failure in the port's vocabulary, by the shared identity policy: only an
 * answered "no session" or a refusal with a code is `refused` (which the
 * boundary reads as signed out); a rate limit, an unexplained error, an outage
 * and a thrown value are `unreachable`.
 */
function failed(error: unknown): ProviderOutcome {
  const { kind, failure } = identityFailure(error);
  return {
    kind: kind === 'signed-out' ? 'refused' : 'unreachable',
    ...failure,
  };
}

/**
 * Asks with the shared deadline. No answer in time is `unreachable` with a
 * `timeout` code; a thrown value is a failure, never an exception.
 */
async function ask<R extends { error: unknown }>(
  call: () => Promise<R>,
  answer: (response: R) => ProviderOutcome,
): Promise<ProviderOutcome> {
  try {
    const response = await withDeadline(call);
    if (response === 'deadline')
      return { kind: 'unreachable', code: 'timeout' };
    if (response.error) return failed(response.error);
    return answer(response);
  } catch (thrown) {
    return failed(thrown);
  }
}

/**
 * The identity boundary's provider for one request's Supabase client: `claims`
 * uses `getClaims()` (local verification), `user` uses `getUser()` (a call to
 * Supabase Auth). Only an answered "no session" is `refused`; anything that
 * leaves the session unknown is `unreachable`, and an error is a failure even
 * when a user came back with it.
 */
export function supabaseIdentityProvider(client: AuthClient): IdentityProvider {
  return {
    claims: () =>
      ask(
        () => client.auth.getClaims(),
        ({ data }) => outcomeFromClaims(data?.claims),
      ),
    user: () =>
      ask(
        () => client.auth.getUser(),
        ({ data }) =>
          data.user ? { kind: 'user', userId: data.user.id } : { kind: 'none' },
      ),
  };
}
