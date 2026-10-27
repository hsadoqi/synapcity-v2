import {
  isAuthRetryableFetchError,
  isAuthSessionMissingError,
  type AuthError,
} from '@supabase/supabase-js';

/** How an operation that acts for the signed-in person reports an Auth error. */
export type AuthErrorOutcome =
  | { kind: 'signed-out' }
  | { kind: 'unavailable' }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Sorts an Auth error into the three outcomes the account operations share: no
 * session, an unreachable service (trying again may work), or anything else,
 * carried by its code.
 */
export function classifyAuthError(error: AuthError): AuthErrorOutcome {
  if (isAuthSessionMissingError(error)) return { kind: 'signed-out' };
  if (isAuthRetryableFetchError(error)) return { kind: 'unavailable' };
  return { kind: 'provider-error', code: error.code };
}
