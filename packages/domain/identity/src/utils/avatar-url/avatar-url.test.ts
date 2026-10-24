import { describe, expect, it } from 'vitest';

import { isUploadedAvatar } from './avatar-url';

describe('isUploadedAvatar', () => {
  it('is true for a file in the public avatars bucket', () => {
    expect(
      isUploadedAvatar(
        'https://x.supabase.co/storage/v1/object/public/avatars/u/a.png',
      ),
    ).toBe(true);
  });

  it('is false for a provider image, an empty value or another bucket', () => {
    expect(isUploadedAvatar('https://avatars.githubusercontent.com/u/1')).toBe(
      false,
    );
    expect(isUploadedAvatar(null)).toBe(false);
    expect(isUploadedAvatar(undefined)).toBe(false);
    expect(
      isUploadedAvatar(
        'https://x.supabase.co/storage/v1/object/public/docs/a.png',
      ),
    ).toBe(false);
  });
});
