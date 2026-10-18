/**
 * The sign-in providers the app offers, in the order they are shown. Sign-in,
 * the settings rows and the connect action all read this one list.
 */
export const OAUTH_PROVIDERS = ['google', 'github'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

const LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  github: 'GitHub',
};

/** Untrusted input (a form field) is narrowed here before it is used. */
export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

/** The name people know the provider by. */
export function providerLabel(provider: OAuthProvider): string {
  return LABELS[provider];
}
