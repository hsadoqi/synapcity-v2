import {
  needsProfileSetup,
  type OAuthProvider,
} from '@synapcity/domain-identity';

import { toProviderFailure, type ProviderFailure } from '../provider-failure';
import type { SupabaseServerClient } from '../request-client';

/*
 * The operations that start, finish or end a session. The same contract as
 * the other auth operations: request client first, already-validated input,
 * and a small outcome of plain values, never an SDK user, session or error.
 */

export type PasswordSignInOutcome =
  | { kind: 'signed-in'; userId: string }
  /** The provider refused; the code says why (wrong password, unconfirmed, …). */
  | { kind: 'refused'; code: string | undefined };

/** Signs in with an email address and password. */
export async function signInWithPassword(
  supabase: SupabaseServerClient,
  input: { email: string; password: string },
): Promise<PasswordSignInOutcome> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) return { kind: 'refused', code: error.code };
  if (!data.user) return { kind: 'refused', code: undefined };
  return { kind: 'signed-in', userId: data.user.id };
}

export type OAuthSignInOutcome =
  /** Send the browser to the provider; it returns to `redirectTo`. */
  | { kind: 'redirect'; url: string }
  | { kind: 'provider-error'; failure: ProviderFailure };

/** Starts a Google or GitHub sign-in. */
export async function startOAuthSignIn(
  supabase: SupabaseServerClient,
  input: { provider: OAuthProvider; redirectTo: string },
): Promise<OAuthSignInOutcome> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: input.provider,
    options: { redirectTo: input.redirectTo },
  });
  if (error)
    return { kind: 'provider-error', failure: toProviderFailure(error) };
  if (!data.url) return { kind: 'provider-error', failure: {} };
  return { kind: 'redirect', url: data.url };
}

export type CodeExchangeOutcome =
  | {
      kind: 'signed-in';
      userId: string;
      /** A new account that has not confirmed its name and photo yet. */
      needsProfileSetup: boolean;
    }
  | { kind: 'failed'; failure: ProviderFailure };

/**
 * Finishes a PKCE redirect (OAuth sign-in, account linking, or an email link)
 * by exchanging its one-time code for a session in this browser's cookies.
 */
export async function exchangeAuthCode(
  supabase: SupabaseServerClient,
  code: string,
): Promise<CodeExchangeOutcome> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return { kind: 'failed', failure: toProviderFailure(error) };
  if (!data.user) return { kind: 'failed', failure: {} };
  return {
    kind: 'signed-in',
    userId: data.user.id,
    needsProfileSetup: needsProfileSetup(data.user),
  };
}

/** Which sessions signing out ends (Supabase's scopes). */
export type SignOutScope = 'local' | 'global' | 'others';

export type SignOutOutcome =
  | { kind: 'signed-out' }
  | { kind: 'failed'; failure: ProviderFailure; thrown?: true };

/**
 * Ends the session. Never throws: the person asked to leave, so the host
 * leaves either way and only logs a failure. The SDK clears this browser's
 * session cookies even when the provider call fails.
 */
export async function signOutSession(
  supabase: SupabaseServerClient,
  input: { scope: SignOutScope },
): Promise<SignOutOutcome> {
  try {
    const { error } = await supabase.auth.signOut({ scope: input.scope });
    if (error) return { kind: 'failed', failure: toProviderFailure(error) };
    return { kind: 'signed-out' };
  } catch {
    return { kind: 'failed', failure: {}, thrown: true };
  }
}
