import { describe, expect, it } from 'vitest';

import { providerImageFrom } from './provider-image';

const github = {
  provider: 'github',
  identity_data: { avatar_url: 'https://avatars.githubusercontent.com/u/1' },
};
const google = {
  provider: 'google',
  identity_data: { picture: 'https://lh3.googleusercontent.com/a/b' },
};

describe('providerImageFrom', () => {
  it('reads GitHub avatar_url and Google picture', () => {
    expect(providerImageFrom([github])).toBe(github.identity_data.avatar_url);
    expect(providerImageFrom([google])).toBe(google.identity_data.picture);
  });

  it('prefers avatar_url over picture on one identity', () => {
    expect(
      providerImageFrom([
        {
          provider: 'google',
          identity_data: {
            picture: 'https://g.test/p.png',
            avatar_url: 'https://g.test/a.png',
          },
        },
      ]),
    ).toBe('https://g.test/a.png');
  });

  it('skips email identities and picks the first provider with a picture', () => {
    expect(
      providerImageFrom([{ provider: 'email', identity_data: {} }, github]),
    ).toBe(github.identity_data.avatar_url);
  });

  it('refuses anything that is not an https URL the database would accept', () => {
    expect(
      providerImageFrom([
        {
          provider: 'github',
          identity_data: { avatar_url: 'http://x.test/a.png' },
        },
        {
          provider: 'google',
          identity_data: { picture: 'javascript:alert(1)' },
        },
        { provider: 'github', identity_data: { avatar_url: 42 } },
        {
          provider: 'github',
          identity_data: { avatar_url: `https://x.test/${'a'.repeat(2048)}` },
        },
      ]),
    ).toBeNull();
  });

  it('is null without identities', () => {
    expect(providerImageFrom(null)).toBeNull();
    expect(providerImageFrom(undefined)).toBeNull();
    expect(providerImageFrom([])).toBeNull();
  });
});
