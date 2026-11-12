import { describe, expect, it } from 'vitest';

describe('@synapcity/server-supabase entries', () => {
  it('loads behind its server-only guard and exposes the adapter', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toEqual([
      'LINK_SIGN_IN_WINDOW_SECONDS',
      'changeEmail',
      'createRequestClient',
      'currentUserFromClaims',
      'disconnectAccount',
      'exchangeAuthCode',
      'hasRecentLinkSignIn',
      'hasRecentLinkSignInNow',
      'isRateLimited',
      'outcomeFromClaims',
      'profileFromClaims',
      'providerImageFrom',
      'readProviderUser',
      'registerWithPassword',
      'requestRecoveryEmail',
      'resendEmailChange',
      'resendSignupConfirmation',
      'sendAccountDeletionLink',
      'sendOwnPasswordReset',
      'signInWithPassword',
      'signOutSession',
      'startAccountLink',
      'startOAuthSignIn',
      'supabaseIdentityProvider',
      'toProviderFailure',
      'updateOwnPassword',
    ]);
  });

  it('keeps the ./claims entry to what the proxy needs', async () => {
    const entry = await import('./claims');

    expect(Object.keys(entry)).toEqual(['readClaims']);
  });
});
