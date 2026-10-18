import { describe, expect, it } from 'vitest';

import {
  AVATAR_ACCEPT,
  AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  MAX_NAME_LENGTH,
  avatarFileSchema,
  nameSchema,
  profileSchema,
} from './schema';

const file = (size: number, type: string, name = 'me.png') =>
  new File([new Uint8Array(size)], name, { type });

describe('limits match the database and the storage bucket', () => {
  it('uses the profiles.display_name length and the avatars bucket size', () => {
    expect(MAX_NAME_LENGTH).toBe(80);
    expect(MAX_AVATAR_BYTES).toBe(2_097_152);
  });

  it('accepts exactly the types the bucket allows', () => {
    expect(Object.keys(AVATAR_TYPES)).toEqual([
      'image/png',
      'image/jpeg',
      'image/webp',
    ]);
    expect(AVATAR_ACCEPT).toBe('image/png,image/jpeg,image/webp');
  });
});

describe('nameSchema', () => {
  it('trims and accepts up to the limit', () => {
    expect(nameSchema.parse('  Ada  ')).toBe('Ada');
    expect(nameSchema.safeParse('x'.repeat(MAX_NAME_LENGTH)).success).toBe(
      true,
    );
  });

  it('measures the limit after trimming, as the database does', () => {
    expect(
      nameSchema.safeParse(` ${'x'.repeat(MAX_NAME_LENGTH)} `).success,
    ).toBe(true);
    expect(nameSchema.safeParse('x'.repeat(MAX_NAME_LENGTH + 1)).success).toBe(
      false,
    );
  });

  it('says what is wrong in the words the form shows', () => {
    expect(nameSchema.safeParse('  ').error?.issues[0]?.message).toBe(
      'Enter your name.',
    );
    expect(
      nameSchema.safeParse('x'.repeat(MAX_NAME_LENGTH + 1)).error?.issues[0]
        ?.message,
    ).toBe(`Use a name of at most ${MAX_NAME_LENGTH} characters.`);
  });
});

describe('profileSchema', () => {
  it('holds just the name; the photo has its own form', () => {
    expect(Object.keys(profileSchema.shape)).toEqual(['name']);
  });
});

describe('avatarFileSchema', () => {
  it('accepts each allowed type at the size limit', () => {
    for (const type of Object.keys(AVATAR_TYPES)) {
      expect(
        avatarFileSchema.safeParse(file(MAX_AVATAR_BYTES, type)).success,
      ).toBe(true);
    }
  });

  it('refuses a file one byte over the limit', () => {
    const result = avatarFileSchema.safeParse(
      file(MAX_AVATAR_BYTES + 1, 'image/png'),
    );
    expect(result.error?.issues[0]?.message).toBe(
      'Use an image of at most 2 MB.',
    );
  });

  it.each(['image/svg+xml', 'image/gif', 'text/html', ''])(
    'refuses the type %j',
    (type) => {
      expect(
        avatarFileSchema.safeParse(file(10, type)).error?.issues[0]?.message,
      ).toBe('Use a PNG, JPEG or WebP image.');
    },
  );

  it.each([
    ['an empty file', file(0, 'image/png')],
    ['no file at all', null],
    ['text instead of a file', 'me.png'],
  ])('asks to choose an image for %s', (_label, value) => {
    expect(avatarFileSchema.safeParse(value).error?.issues[0]?.message).toBe(
      'Choose an image.',
    );
  });
});
