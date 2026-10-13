import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthButtons } from './auth-buttons';

describe('AuthButtons', () => {
  it('links to sign in and sign up', () => {
    render(<AuthButtons />);

    expect(
      screen.getByRole('link', { name: 'Sign in' }).getAttribute('href'),
    ).toBe('/auth/login');
    expect(
      screen.getByRole('link', { name: 'Sign up' }).getAttribute('href'),
    ).toBe('/auth/register');
  });

  it('records the variant it rendered', () => {
    const { container } = render(<AuthButtons variant="hero" />);

    expect(
      container
        .querySelector('[data-slot="auth-buttons"]')
        ?.getAttribute('data-variant'),
    ).toBe('hero');
  });
});
