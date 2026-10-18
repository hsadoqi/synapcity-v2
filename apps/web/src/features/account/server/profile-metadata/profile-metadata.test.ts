import { describe, expect, it } from 'vitest';

import {
  withAvatarUrl,
  withFullName,
  withProfileConfirmed,
} from './profile-metadata';

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

describe('withAvatarUrl', () => {
  it('sets avatar_url and keeps every other field', () => {
    expect(
      withAvatarUrl(
        { full_name: 'Ada', avatar_url: 'https://old.test/a.png' },
        'https://new.test/b.png',
      ),
    ).toEqual({ full_name: 'Ada', avatar_url: 'https://new.test/b.png' });
  });

  it('drops the key for null so the header falls back to initials', () => {
    expect(
      withAvatarUrl(
        { full_name: 'Ada', avatar_url: 'https://old.test/a.png' },
        null,
      ),
    ).toEqual({ full_name: 'Ada' });
  });

  it('works when the user has no metadata yet and does not mutate its input', () => {
    expect(withAvatarUrl(undefined, 'https://x.test/a.png')).toEqual({
      avatar_url: 'https://x.test/a.png',
    });
    const existing = { avatar_url: 'https://old.test/a.png' };
    withAvatarUrl(existing, null);
    expect(existing).toEqual({ avatar_url: 'https://old.test/a.png' });
  });
});

describe('withProfileConfirmed', () => {
  it('sets the flag and keeps every other field', () => {
    expect(
      withProfileConfirmed({
        full_name: 'Ada',
        avatar_url: 'https://x.test/a.png',
      }),
    ).toEqual({
      full_name: 'Ada',
      avatar_url: 'https://x.test/a.png',
      profile_confirmed: true,
    });
  });

  it('works with no metadata and does not mutate its input', () => {
    expect(withProfileConfirmed(null)).toEqual({ profile_confirmed: true });
    const existing = { full_name: 'Ada' };
    withProfileConfirmed(existing);
    expect(existing).toEqual({ full_name: 'Ada' });
  });
});
