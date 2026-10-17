import { describe, expect, it } from 'vitest';

import {
  currentUserFromClaims,
  profileFromClaims,
  withFullName,
} from './profile';

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

describe('withFullName', () => {
  it('sets full_name and keeps every other field, such as an OAuth avatar', () => {
    expect(
      withFullName(
        {
          full_name: 'Old Name',
          name: 'Old',
          avatar_url: 'https://x.test/a.png',
        },
        'Ada Lovelace',
      ),
    ).toEqual({
      full_name: 'Ada Lovelace',
      name: 'Old',
      avatar_url: 'https://x.test/a.png',
    });
  });

  it('works when the user has no metadata yet', () => {
    expect(withFullName(null, 'Ada')).toEqual({ full_name: 'Ada' });
    expect(withFullName(undefined, 'Ada')).toEqual({ full_name: 'Ada' });
  });

  it('does not mutate its input', () => {
    const existing = { full_name: 'Old' };
    withFullName(existing, 'New');
    expect(existing).toEqual({ full_name: 'Old' });
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
