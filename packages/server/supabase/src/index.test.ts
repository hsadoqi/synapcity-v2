import { describe, expect, it } from 'vitest';

describe('@synapcity/server-supabase root entry', () => {
  it('loads behind its server-only guard and exposes the adapter', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toEqual([
      'LINK_SIGN_IN_WINDOW_SECONDS',
      'changeEmail',
      'createRequestClient',
      'disconnectAccount',
      'exchangeAuthCode',
      'hasRecentLinkSignIn',
      'hasRecentLinkSignInNow',
      'isRateLimited',
      'outcomeFromClaims',
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
});
