import {
  isAuthRetryableFetchError,
  type AuthError,
  type SupabaseClient,
} from '@supabase/supabase-js';
import type { IdentityProvider, ProviderOutcome } from '@synapcity/server-auth';

import { toProviderFailure } from '../provider-failure';

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

function failed(error: AuthError): ProviderOutcome {
  return isAuthRetryableFetchError(error)
    ? { kind: 'unreachable', ...toProviderFailure(error) }
    : { kind: 'refused', ...toProviderFailure(error) };
}

/**
 * The identity boundary's provider for one request's Supabase client: `claims`
 * uses `getClaims()` (local verification), `user` uses `getUser()` (a call to
 * Supabase Auth). A dropped connection is `unreachable`, other errors are
 * `refused`, and an error is a failure even when a user came back with it.
 */
export function supabaseIdentityProvider(client: AuthClient): IdentityProvider {
  return {
    async claims() {
      const { data, error } = await client.auth.getClaims();
      if (error) return failed(error);
      return outcomeFromClaims(data?.claims);
    },
    async user() {
      const { data, error } = await client.auth.getUser();
      if (error) return failed(error);
      return data.user
        ? { kind: 'user', userId: data.user.id }
        : { kind: 'none' };
    },
  };
}
