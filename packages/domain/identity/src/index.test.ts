import { describe, expect, it } from 'vitest';

describe('@synapcity/domain-identity root entry', () => {
  it('exposes the identity schemas and constants', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toEqual([
      'ALREADY_YOUR_EMAIL',
      'AVATAR_ACCEPT',
      'AVATAR_FILE_TYPES',
      'MAX_AVATAR_BYTES',
      'MAX_NAME_LENGTH',
      'MIN_PASSWORD_LENGTH',
      'NEW_ACCOUNT_DAYS',
      'OAUTH_PROVIDERS',
      'PASSWORD_REQUIREMENTS',
      'PASSWORD_TOO_SHORT_MESSAGE',
      'PROFILE_CONFIRMED_KEY',
      'avatarFileSchema',
      'checkName',
      'currentUserFromClaims',
      'emailRequestSchema',
      'everyRefusal',
      'firstRefusal',
      'initialsOf',
      'isNewAccount',
      'isOAuthProvider',
      'isProfileConfirmed',
      'isRateLimited',
      'isUploadedAvatar',
      'missingCharactersMessage',
      'nameSchema',
      'needsProfileSetup',
      'newPasswordSchema',
      'profileFromClaims',
      'profileSchema',
      'providerImageFrom',
      'providerLabel',
      'signInSchema',
      'signUpSchema',
      'updatePasswordSchema',
    ]);
  });
});
