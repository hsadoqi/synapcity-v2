import {
  AuthInvalidJwtError,
  isAuthApiError,
  isAuthError,
  isAuthRetryableFetchError,
  isAuthSessionMissingError,
} from '@supabase/supabase-js';

import { toProviderFailure, type ProviderFailure } from '../provider-failure';

/**
 * What an Auth failure says, before any caller decides what to tell the
 * person. Authentication failures, rate limits and outages are kept apart so
 * that no caller can read a rate limit or an outage as a lost session:
 *
 * - `signed-out`: the service, or the token itself, says there is no session
 *   (a missing session, `session_not_found`, an invalid JWT).
 * - `refused`: the service answered with a 4xx and a code, other than a rate
 *   limit. It refused this request for a stated reason (`bad_jwt`,
 *   `user_not_found`, `manual_linking_disabled`, …).
 * - `rate-limited`: a 429, or a rate-limit code. It says nothing about the
 *   session.
 * - `rejected`: an error that does not explain itself: a 4xx without a code,
 *   or an Auth error that is not an `AuthApiError` (a weak password, a PKCE
 *   or implicit-grant failure).
 * - `unavailable`: no usable answer: a dropped connection, any 5xx, a body
 *   that was not JSON, a non-Auth value, or no answer before the deadline.
 *
 * Every class carries the failure's code and status only, never its message.
 */
export type AuthFailureClass =
  | { class: 'signed-out'; failure: ProviderFailure }
  | { class: 'refused'; code: string; failure: ProviderFailure }
  | {
      class: 'rate-limited';
      code: string | undefined;
      failure: ProviderFailure;
    }
  | { class: 'rejected'; code: string | undefined; failure: ProviderFailure }
  | { class: 'unavailable'; failure: ProviderFailure };

/**
 * Whether a Supabase Auth error code means "slow down". These say nothing about
 * any account, so they are safe to show even where every other error is
 * answered identically to avoid account discovery.
 */
export function isRateLimited(code: string | undefined): boolean {
  return (
    code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit'
  );
}

/**
 * Sorts any Auth failure, returned or thrown, into one of the classes above.
 * The one place the rules live; each context maps the class to its own
 * outcome (`identityFailure`, `classifyAuthError`).
 */
export function classifyAuthFailure(error: unknown): AuthFailureClass {
  if (!isAuthError(error)) return { class: 'unavailable', failure: {} };
  const failure = toProviderFailure(error);
  // auth-js turns a `session_not_found` answer into `AuthSessionMissingError`;
  // the code is checked too, so an error built another way means the same.
  if (
    isAuthSessionMissingError(error) ||
    error instanceof AuthInvalidJwtError ||
    error.code === 'session_not_found'
  ) {
    return { class: 'signed-out', failure };
  }
  // Every 5xx outage and every failed connection is retryable in auth-js;
  // an error body that was not JSON is `AuthUnknownError`, which is no answer.
  if (isAuthRetryableFetchError(error) || error.name === 'AuthUnknownError') {
    return { class: 'unavailable', failure };
  }
  const code = typeof error.code === 'string' ? error.code : undefined;
  if (error.status === 429 || isRateLimited(code)) {
    return { class: 'rate-limited', code, failure };
  }
  if (
    isAuthApiError(error) &&
    code !== undefined &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return { class: 'refused', code, failure };
  }
  if (isAuthApiError(error) && (error.status < 400 || error.status >= 500)) {
    // An API error outside 4xx that auth-js did not mark retryable (a 505,
    // say) is still the service failing, not an answer about the session.
    return { class: 'unavailable', failure };
  }
  return { class: 'rejected', code, failure };
}

/**
 * What a failure means for a check of who the caller is (`readClaims`, the
 * identity provider, `readProviderUser`). Only an answered "no session" or a
 * refusal with a code is signed out; a rate limit, an unexplained error and an
 * outage are all unavailable, because the service has not said the person is
 * signed out.
 */
export function identityFailure(error: unknown): {
  kind: 'signed-out' | 'unavailable';
  failure: ProviderFailure;
} {
  const sorted = classifyAuthFailure(error);
  return {
    kind:
      sorted.class === 'signed-out' || sorted.class === 'refused'
        ? 'signed-out'
        : 'unavailable',
    failure: sorted.failure,
  };
}

/** How an operation that acts for the signed-in person reports an Auth error. */
export type AuthErrorOutcome =
  | { kind: 'signed-out' }
  /** Carries the code and status only, so the host can log the outage. */
  | { kind: 'unavailable'; failure: ProviderFailure }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Sorts an Auth error into the three outcomes the account operations share: no
 * session, an unreachable service (trying again may work), or anything else,
 * carried by its code so the host can say what the provider refused. A rate
 * limit keeps its code here; operations whose outcome has `rate-limited` check
 * `isRateLimited` first.
 */
export function classifyAuthError(error: unknown): AuthErrorOutcome {
  const sorted = classifyAuthFailure(error);
  switch (sorted.class) {
    case 'signed-out':
      return { kind: 'signed-out' };
    case 'unavailable':
      return { kind: 'unavailable', failure: sorted.failure };
    case 'refused':
    case 'rate-limited':
    case 'rejected':
      return { kind: 'provider-error', code: sorted.code };
  }
}

/**
 * How long a request waits for the Auth service before it is called
 * unavailable. The SDK retries a dead service with backoff for about a minute;
 * a page or an action must not hang that long to say "try again".
 */
export const AUTH_DEADLINE_MS = 4000;

/**
 * Runs an Auth call with a deadline. A synchronous throw becomes a rejection
 * like any other failure; if the deadline wins, the call is left to finish on
 * its own, its result ignored and a later rejection swallowed, so it never
 * becomes an unhandled one. Thrown values still reject: the caller classifies
 * them.
 */
export async function withDeadline<T>(
  call: () => Promise<T>,
  deadlineMs: number = AUTH_DEADLINE_MS,
): Promise<T | 'deadline'> {
  const pending = Promise.resolve().then(call);
  pending.catch(() => undefined);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<'deadline'>((resolve) => {
    timer = setTimeout(() => resolve('deadline'), deadlineMs);
  });
  try {
    return await Promise.race([pending, deadline]);
  } finally {
    clearTimeout(timer);
  }
}
