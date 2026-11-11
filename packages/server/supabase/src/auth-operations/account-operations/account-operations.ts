import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { OAuthProvider } from '@synapcity/domain-identity';
import { classifyAuthError } from '../../auth-errors';
import { SupabaseServerClient } from '../../request-client';

export type AccountLinkOutcome =
  /** Send the browser to the provider; it brings the person back to `redirectTo`. */
  | { kind: 'redirect'; url: string }
  | { kind: 'signed-out' }
  | { kind: 'unavailable' }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Starts linking a Google or GitHub account to the signed-in person's account.
 * The provider only links an account the person signs in to, and refuses one
 * that already belongs to this or another account. Linking has to be switched
 * on in the project's settings; when it is not, the code says so.
 */
export async function startAccountLink(
  supabase: SupabaseServerClient,
  input: {
    provider: OAuthProvider;
    redirectTo: string;
  },
): Promise<AccountLinkOutcome> {
  const { data, error } = await supabase.auth.linkIdentity({
    provider: input.provider,
    options: { redirectTo: input.redirectTo },
  });
  if (error) return classifyAuthError(error);
  if (!data?.url) return { kind: 'provider-error', code: undefined };
  return { kind: 'redirect', url: data.url };
}

export type DisconnectOutcome =
  | { kind: 'disconnected' }
  /** It is not linked (any more), so there is nothing to remove. */
  | { kind: 'not-connected' }
  /** Removing it would leave no way to sign in. Nothing was changed. */
  | { kind: 'last-sign-in' }
  | { kind: 'signed-out' }
  | { kind: 'unavailable' }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Unlinks a Google or GitHub account from the signed-in person's account. The
 * caller names only the provider; the identity record the SDK needs is looked
 * up here, from the person's own identities, so nothing the browser sends can
 * point at another account. The last remaining way to sign in is never removed.
 */
export async function disconnectAccount(
  supabase: SupabaseServerClient,
  input: {
    provider: OAuthProvider;
  },
): Promise<DisconnectOutcome> {
  const { data, error } = await supabase.auth.getUserIdentities();
  if (error) return classifyAuthError(error);
  const identities = data?.identities ?? [];
  const identity = identities.find((item) => item.provider === input.provider);
  if (!identity) return { kind: 'not-connected' };
  if (identities.length < 2) return { kind: 'last-sign-in' };

  const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
  if (unlinkError) {
    if (unlinkError.code === 'single_identity_not_deletable') {
      return { kind: 'last-sign-in' };
    }
    if (unlinkError.code === 'identity_not_found') {
      return { kind: 'not-connected' };
    }
    if (isAuthRetryableFetchError(unlinkError)) return { kind: 'unavailable' };
    return { kind: 'provider-error', code: unlinkError.code };
  }
  return { kind: 'disconnected' };
}
