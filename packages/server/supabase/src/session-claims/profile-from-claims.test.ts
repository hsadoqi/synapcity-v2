import { describe, expect, it } from 'vitest';

import {
  currentUserFromClaims,
  profileFromClaims,
} from './profile-from-claims';

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

  it('reads the picture from avatar_url (GitHub) or picture (Google)', () => {
    expect(
      profileFromClaims({
        user_metadata: { avatar_url: 'https://gh.test/a.png' },
      }).imageUrl,
    ).toBe('https://gh.test/a.png');
    expect(
      profileFromClaims({ user_metadata: { picture: 'https://g.test/b.png' } })
        .imageUrl,
    ).toBe('https://g.test/b.png');
  });

  it('returns nulls when metadata and email are absent', () => {
    expect(profileFromClaims({})).toEqual({
      name: null,
      displayName: null,
      firstName: null,
      lastName: null,
      email: null,
      imageUrl: null,
    });
  });

  it('ignores non-string metadata values', () => {
    expect(
      profileFromClaims({ user_metadata: { full_name: 42, avatar_url: {} } }),
    ).toEqual({
      name: null,
      displayName: null,
      firstName: null,
      lastName: null,
      email: null,
      imageUrl: null,
    });
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
      displayName: 'Ada Lovelace',
      firstName: null,
      lastName: null,
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
      displayName: 'Ada',
      firstName: null,
      lastName: null,
      email: 'a@b.co',
      imageUrl: 'https://x/y.png',
    });
  });
});

describe('the name of an email registrant', () => {
  // Email registration sends first_name and last_name and no full_name; the
  // display name stays empty until the person sets one.
  const registrant = {
    sub: 'u2',
    email: 'ada@example.com',
    user_metadata: { first_name: 'Ada', last_name: 'Lovelace' },
  };

  it('shows the first name, never the last name', () => {
    expect(profileFromClaims(registrant).name).toBe('Ada');
    expect(currentUserFromClaims(registrant).name).toBe('Ada');
  });

  it('leaves the editable display name empty, so nothing is derived into it', () => {
    expect(profileFromClaims(registrant).displayName).toBeNull();
  });

  it('prefers a display name the person set over the first name', () => {
    const named = {
      ...registrant,
      user_metadata: { ...registrant.user_metadata, full_name: 'Ada L.' },
    };
    expect(profileFromClaims(named)).toMatchObject({
      name: 'Ada L.',
      displayName: 'Ada L.',
    });
  });

  it('ignores a blank or non-string first name', () => {
    expect(
      profileFromClaims({ user_metadata: { first_name: '   ' } }).name,
    ).toBeNull();
    expect(
      profileFromClaims({ user_metadata: { first_name: 7 } }).name,
    ).toBeNull();
  });

  it('reads the structured names, for prefilling forms', () => {
    expect(currentUserFromClaims(registrant)).toMatchObject({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });

  it('keeps the current user to the display fields only', () => {
    expect(Object.keys(currentUserFromClaims(registrant)).sort()).toEqual([
      'displayName',
      'email',
      'firstName',
      'id',
      'imageUrl',
      'lastName',
      'name',
    ]);
  });
});
