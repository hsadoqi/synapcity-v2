import { OAUTH_PROVIDERS, type OAuthProvider } from '../oauth-providers';

/** The part of a Supabase identity this reads. */
type IdentityLike = {
  provider?: string;
  identity_data?: Record<string, unknown> | null;
};

/**
 * A provider account linked to this one, reduced to what the page shows. Only
 * this reaches the browser, never the identity record, which holds more than
 * the page needs.
 */
export type ConnectedAccount = {
  provider: OAuthProvider;
  /** The address or username on that account, when it gave one. */
  detail: string | null;
};

function text(value: unknown): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
}

/**
 * The offered providers this account is linked to, in display order. Other
 * identities (the email and password one) are not providers to connect, so
 * they are left out. GitHub supplies `user_name`; both supply `email`.
 */
export function connectedAccountsFrom(
  identities: readonly IdentityLike[] | null | undefined,
): ConnectedAccount[] {
  const accounts: ConnectedAccount[] = [];
  for (const provider of OAUTH_PROVIDERS) {
    const identity = identities?.find((item) => item.provider === provider);
    if (!identity) continue;
    const data = identity.identity_data ?? {};
    accounts.push({
      provider,
      detail: text(data.email) ?? text(data.user_name) ?? text(data.name),
    });
  }
  return accounts;
}
