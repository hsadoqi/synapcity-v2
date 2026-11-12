import { describe, expect, it } from 'vitest';

describe('@synapcity/server-account root entry', () => {
  it('loads behind its server-only guard and exposes the account operations', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toEqual([
      'deleteOwnAccount',
      'mirrorToSession',
      'readAccountPreferenceRow',
      'readProfileSetup',
      'saveAvatar',
      'saveName',
      'saveProfileNames',
      'skipProfileSetup',
      'withProfileConfirmed',
      'writeAccountPreferenceRow',
    ]);
  });
});
