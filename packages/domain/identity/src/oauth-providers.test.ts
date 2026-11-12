import { describe, expect, it } from 'vitest';

import {
  OAUTH_PROVIDERS,
  isOAuthProvider,
  providerLabel,
} from './oauth-providers';

describe('the offered providers', () => {
  it('are Google then GitHub, in the order they are shown', () => {
    expect([...OAUTH_PROVIDERS]).toEqual(['google', 'github']);
  });

  it('are named the way people know them', () => {
    expect(providerLabel('google')).toBe('Google');
    expect(providerLabel('github')).toBe('GitHub');
  });
});

describe('isOAuthProvider', () => {
  it.each(['google', 'github'])('accepts %s', (value) => {
    expect(isOAuthProvider(value)).toBe(true);
  });

  it.each([
    '',
    'Google',
    'GITHUB',
    'facebook',
    'google ',
    'constructor',
    '__proto__',
    '<script>',
  ])('refuses %j, since a form field is untrusted', (value) => {
    expect(isOAuthProvider(value)).toBe(false);
  });
});
