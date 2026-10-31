import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthLinkButton } from './auth-link-button';

const href = () => screen.getByRole('link').getAttribute('href');

describe('AuthLinkButton', () => {
  it('links back to sign in by default', () => {
    render(<AuthLinkButton />);

    expect(screen.getByRole('link', { name: 'Back to sign in' })).toBeTruthy();
    expect(href()).toBe('/auth/login');
  });

  it.each([
    ['login', '/auth/login'],
    ['register', '/auth/register'],
    ['forgot-password', '/auth/forgot-password'],
    ['update-password', '/auth/update-password'],
  ] as const)('goes to %s', (type, path) => {
    render(<AuthLinkButton type={type} />);

    expect(href()).toBe(path);
  });

  it('uses a custom label', () => {
    render(<AuthLinkButton type="register" label="Create an account" />);

    expect(
      screen.getByRole('link', { name: 'Create an account' }),
    ).toBeTruthy();
  });

  it('carries a safe next destination across, encoded', () => {
    render(<AuthLinkButton type="register" next="/u/1/settings?tab=a b" />);

    expect(href()).toBe(
      `/auth/register?next=${encodeURIComponent('/u/1/settings?tab=a b')}`,
    );
  });

  it('omits next when there is none', () => {
    render(<AuthLinkButton type="login" />);

    expect(href()).not.toContain('next=');
  });
});
