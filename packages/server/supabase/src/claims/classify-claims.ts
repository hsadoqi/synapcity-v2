import {
  AuthInvalidJwtError,
  isAuthApiError,
  isAuthError,
  isAuthRetryableFetchError,
  isAuthSessionMissingError,
  type AuthError,
  type JwtPayload,
  type SupabaseClient,
} from '@supabase/supabase-js';

import { toProviderFailure } from '../provider-failure/provider-failure';
import type { ProviderFailure } from '../provider-failure/provider-failure';

/**
 * What `getClaims()` means for access. `unavailable` is its own state: an
 * outage must not read as "signed out", or every request during one redirects
 * people to sign in (and a protected page looks like it lost their session).
 */
export type ClaimsResult =
  | { status: 'verified'; claims: JwtPayload }
  | { status: 'signed-out' }
  | { status: 'unavailable'; failure: ProviderFailure };

type ClaimsResponse = {
  data: { claims: JwtPayload } | null;
  error: AuthError | null;
};

/**
 * Only an answered "no session" counts as signed out: no token, a token that
 * is invalid, or a refresh the Auth service refused with a 4xx and a code. A
 * dropped connection, a 5xx, a rate limit (429) and any failure that carries no
 * code are `unavailable`: the service has not said the person is signed out.
 */
function classifyError(error: AuthError): ClaimsResult {
  if (
    isAuthSessionMissingError(error) ||
    error instanceof AuthInvalidJwtError
  ) {
    return { status: 'signed-out' };
  }
  if (isAuthRetryableFetchError(error)) {
    return { status: 'unavailable', failure: toProviderFailure(error) };
  }
  if (
    isAuthApiError(error) &&
    typeof error.code === 'string' &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 429
  ) {
    return { status: 'signed-out' };
  }
  return { status: 'unavailable', failure: toProviderFailure(error) };
}

/** Sorts a `getClaims()` response into the three states. */
export function classifyClaimsResponse(response: ClaimsResponse): ClaimsResult {
  if (response.error) return classifyError(response.error);
  return response.data?.claims
    ? { status: 'verified', claims: response.data.claims }
    : { status: 'signed-out' };
}

/**
 * Calls `getClaims()` and classifies the answer. A thrown error (the SDK
 * rethrows what it cannot wrap, such as a failed key fetch) is `unavailable`
 * too, never an unhandled rejection that turns into a 500 or a sign-out.
 */
export async function readClaims(client: {
  auth: Pick<SupabaseClient['auth'], 'getClaims'>;
}): Promise<ClaimsResult> {
  try {
    return classifyClaimsResponse(await client.auth.getClaims());
  } catch (thrown) {
    return {
      status: 'unavailable',
      failure: toProviderFailure(isAuthError(thrown) ? thrown : {}),
    };
  }
}
