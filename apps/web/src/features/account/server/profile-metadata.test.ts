import { describe, expect, it } from 'vitest';

import { withFullName } from './profile-metadata';

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
