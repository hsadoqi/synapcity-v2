import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthButtons } from './auth-buttons';

let pathname = '/';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

beforeEach(() => {
  pathname = '/';
});

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

  it('keeps Sign up filled outside the auth pages', () => {
    render(<AuthButtons />);

    expect(screen.getByRole('link', { name: 'Sign up' }).className).toContain(
      'bg-primary-foreground',
    );
  });

  it('goes quiet on an auth page and marks the open page', () => {
    pathname = '/auth/login';
    render(<AuthButtons />);

    const signIn = screen.getByRole('link', { name: 'Sign in' });
    const signUp = screen.getByRole('link', { name: 'Sign up' });

    expect(signIn.getAttribute('aria-current')).toBe('page');
    expect(signIn.className).toContain('bg-secondary');
    expect(signUp.className).not.toContain('bg-primary-foreground');
  });
});
