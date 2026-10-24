import { describe, expect, it } from 'vitest';

describe('@synapcity/domain-identity root entry', () => {
  it('exposes the identity schemas and constants', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toEqual([
      'AVATAR_ACCEPT',
      'AVATAR_FILE_TYPES',
      'MAX_AVATAR_BYTES',
      'MAX_NAME_LENGTH',
      'avatarFileSchema',
      'nameSchema',
      'profileSchema',
    ]);
  });
});
