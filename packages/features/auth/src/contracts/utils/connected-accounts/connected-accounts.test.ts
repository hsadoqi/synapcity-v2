import { describe, expect, it } from 'vitest';

import { connectedAccountsFrom } from './connected-accounts';

const google = {
  provider: 'google',
  identity_data: {
    email: 'ada@gmail.com',
    name: 'Ada',
    picture: 'https://x/a',
  },
};
const github = {
  provider: 'github',
  identity_data: { user_name: 'ada-l', name: 'Ada Lovelace', email: null },
};

describe('connectedAccountsFrom', () => {
  it('lists the providers that are linked, with the address or username on each', () => {
    expect(connectedAccountsFrom([google, github])).toEqual([
      { provider: 'google', detail: 'ada@gmail.com' },
      { provider: 'github', detail: 'ada-l' },
    ]);
  });

  it('lists only what is linked', () => {
    expect(connectedAccountsFrom([github])).toEqual([
      { provider: 'github', detail: 'ada-l' },
    ]);
    expect(connectedAccountsFrom([])).toEqual([]);
  });

  it('keeps the order the page shows them in, whatever order they came in', () => {
    expect(
      connectedAccountsFrom([github, google]).map((item) => item.provider),
    ).toEqual(['google', 'github']);
  });

  it('leaves out the password identity and anything that is not offered', () => {
    expect(
      connectedAccountsFrom([
        { provider: 'email', identity_data: { email: 'ada@example.com' } },
        { provider: 'facebook', identity_data: { email: 'x@y.z' } },
        google,
      ]),
    ).toEqual([{ provider: 'google', detail: 'ada@gmail.com' }]);
  });

  it('prefers the address, then the username, then the name', () => {
    expect(
      connectedAccountsFrom([
        { provider: 'github', identity_data: { user_name: 'u', name: 'N' } },
      ])[0]?.detail,
    ).toBe('u');
    expect(
      connectedAccountsFrom([
        { provider: 'github', identity_data: { name: 'N' } },
      ])[0]?.detail,
    ).toBe('N');
  });

  it('still lists an account that gave nothing to show', () => {
    expect(
      connectedAccountsFrom([{ provider: 'google', identity_data: {} }]),
    ).toEqual([{ provider: 'google', detail: null }]);
    expect(connectedAccountsFrom([{ provider: 'google' }])).toEqual([
      { provider: 'google', detail: null },
    ]);
  });

  it('ignores values that are not text, and blank text', () => {
    expect(
      connectedAccountsFrom([
        {
          provider: 'google',
          identity_data: { email: 42, user_name: '  ', name: {} },
        },
      ]),
    ).toEqual([{ provider: 'google', detail: null }]);
  });

  it('carries only the provider and one display string, never the identity record', () => {
    const [account] = connectedAccountsFrom([google]);

    expect(Object.keys(account!).sort()).toEqual(['detail', 'provider']);
    expect(JSON.stringify(account)).not.toContain('picture');
  });

  it('copes with no identities at all', () => {
    expect(connectedAccountsFrom(null)).toEqual([]);
    expect(connectedAccountsFrom(undefined)).toEqual([]);
  });
});
