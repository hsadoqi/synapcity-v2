import { describe, expect, it } from 'vitest';

import { currentUserFromClaims, profileFromClaims } from './current-user';

describe('profileFromClaims', () => {
  it('prefers full_name, then name', () => {
    expect(
      profileFromClaims({
        email: 'a@b.co',
        user_metadata: { full_name: 'Ada Lovelace', name: 'ada' },
      }).name,
    ).toBe('Ada Lovelace');
    expect(
      profileFromClaims({ email: 'a@b.co', user_metadata: { name: 'ada' } })
        .name,
    ).toBe('ada');
  });

  it('returns nulls when metadata and email are absent', () => {
    expect(profileFromClaims({})).toEqual({
      name: null,
      email: null,
      imageUrl: null,
    });
  });

  it('ignores non-string metadata values', () => {
    expect(
      profileFromClaims({ user_metadata: { full_name: 42, avatar_url: {} } }),
    ).toEqual({ name: null, email: null, imageUrl: null });
  });

  it('trims the name', () => {
    expect(
      profileFromClaims({ user_metadata: { full_name: '  Ada Lovelace ' } })
        .name,
    ).toBe('Ada Lovelace');
  });

  it('reads the shape an OAuth provider fills in', () => {
    expect(
      profileFromClaims({
        email: 'a@b.co',
        user_metadata: {
          full_name: 'Ada Lovelace',
          name: 'Ada Lovelace',
          avatar_url: 'https://x.test/a.png',
        },
      }),
    ).toEqual({
      name: 'Ada Lovelace',
      email: 'a@b.co',
      imageUrl: 'https://x.test/a.png',
    });
  });

  it('reads the avatar url', () => {
    expect(
      profileFromClaims({
        user_metadata: { avatar_url: 'https://x.test/a.png' },
      }).imageUrl,
    ).toBe('https://x.test/a.png');
  });
});

describe('currentUserFromClaims', () => {
  it('adds the user id (sub) to the display profile', () => {
    expect(
      currentUserFromClaims({
        sub: 'u1',
        email: 'a@b.co',
        user_metadata: { full_name: 'Ada', avatar_url: 'https://x/y.png' },
      }),
    ).toEqual({
      id: 'u1',
      name: 'Ada',
      email: 'a@b.co',
      imageUrl: 'https://x/y.png',
    });
  });
});
