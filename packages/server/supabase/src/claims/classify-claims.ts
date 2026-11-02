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

import { toProviderFailure, type ProviderFailure } from '../provider-failure';

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
 * How long a request waits for the Auth service before it is called
 * unavailable. The SDK retries a dead service with backoff for about a minute;
 * a page or an API call must not hang that long to say "try again". Each step
 * of a request that asks (the proxy, then the render) waits its own deadline,
 * so a page can take a few multiples of this.
 */
export const CLAIMS_DEADLINE_MS = 4000;

/**
 * Calls `getClaims()` and classifies the answer. A thrown error (the SDK
 * rethrows what it cannot wrap, such as a failed key fetch) is `unavailable`
 * too, never an unhandled rejection that turns into a 500 or a sign-out. So is
 * an answer that has not come within `deadlineMs`: the call is left to finish
 * on its own, and its result is ignored.
 */
export async function readClaims(
  client: { auth: Pick<SupabaseClient['auth'], 'getClaims'> },
  { deadlineMs = CLAIMS_DEADLINE_MS }: { deadlineMs?: number } = {},
): Promise<ClaimsResult> {
  // A synchronous throw becomes a rejection like any other failure.
  const pending = Promise.resolve().then(() => client.auth.getClaims());
  // If the deadline wins, a later rejection must not become an unhandled one.
  pending.catch(() => undefined);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<'deadline'>((resolve) => {
    timer = setTimeout(() => resolve('deadline'), deadlineMs);
  });
  try {
    const first = await Promise.race([pending, deadline]);
    if (first === 'deadline') {
      return { status: 'unavailable', failure: { code: 'timeout' } };
    }
    return classifyClaimsResponse(first);
  } catch (thrown) {
    return {
      status: 'unavailable',
      failure: toProviderFailure(isAuthError(thrown) ? thrown : {}),
    };
  } finally {
    clearTimeout(timer);
  }
}
