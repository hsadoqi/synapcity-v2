import { describe, expect, it } from 'vitest';

import { signInHref } from './sign-in-href';

describe('signInHref', () => {
  it('sends a person to sign in and back to the page they were on', () => {
    expect(signInHref('/u1/settings')).toBe(
      '/auth/login?next=%2Fu1%2Fsettings',
    );
  });

  it('encodes the page so it cannot add a parameter of its own', () => {
    expect(signInHref('/a?b=1&c=2')).toBe(
      '/auth/login?next=%2Fa%3Fb%3D1%26c%3D2',
    );
  });
});
