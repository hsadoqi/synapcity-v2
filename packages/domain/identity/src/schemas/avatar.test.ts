import { describe, expect, it } from 'vitest';

import {
  AVATAR_ACCEPT,
  AVATAR_FILE_TYPES,
  MAX_AVATAR_BYTES,
  avatarFileSchema,
} from './avatar';

const file = (size: number, type: string) =>
  new File([new Uint8Array(size)], 'avatar', { type });

describe('avatar constants', () => {
  it('matches the avatars bucket size limit', () => {
    expect(MAX_AVATAR_BYTES).toBe(2_097_152);
  });

  it('lists exactly the types the bucket accepts', () => {
    expect(AVATAR_FILE_TYPES).toEqual({
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
    });
  });

  it('builds the accept attribute from the same types', () => {
    expect(AVATAR_ACCEPT).toBe('image/png,image/jpeg,image/webp');
  });
});

describe('avatarFileSchema', () => {
  it.each(Object.keys(AVATAR_FILE_TYPES))('accepts a %s file', (type) => {
    expect(avatarFileSchema.safeParse(file(10, type)).success).toBe(true);
  });

  it('accepts a file of exactly the maximum size', () => {
    expect(
      avatarFileSchema.safeParse(file(MAX_AVATAR_BYTES, 'image/png')).success,
    ).toBe(true);
  });

  it('refuses a file one byte over the maximum size', () => {
    const result = avatarFileSchema.safeParse(
      file(MAX_AVATAR_BYTES + 1, 'image/png'),
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'Use an image of at most 2 MB.',
    );
  });

  it('refuses an empty file', () => {
    const result = avatarFileSchema.safeParse(file(0, 'image/png'));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Choose an image.');
  });

  it.each([
    ['image/gif', 'an unsupported image type'],
    ['image/svg+xml', 'SVG, which can carry script'],
    ['', 'a file with no type'],
    ['image/jp', 'a fragment of an accepted type'],
    ['png', 'a bare extension'],
  ])('refuses type %j (%s)', (type) => {
    const result = avatarFileSchema.safeParse(file(10, type));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'Use a PNG, JPEG or WebP image.',
    );
  });

  it('requires a file unless the caller makes it optional', () => {
    expect(avatarFileSchema.safeParse(undefined).success).toBe(false);
    expect(avatarFileSchema.optional().safeParse(undefined).success).toBe(true);
  });

  it('refuses a value that is not a file', () => {
    expect(avatarFileSchema.safeParse('avatar.png').success).toBe(false);
    expect(avatarFileSchema.safeParse({ size: 10 }).success).toBe(false);
  });
});
