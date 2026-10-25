import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthButtons } from './auth-buttons';

let pathname = '/';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

// Routes the component must not know: the consumer supplies every destination.
const destinations = { signInHref: '/enter', signUpHref: '/join' };

beforeEach(() => {
  pathname = '/';
});

describe('AuthButtons', () => {
  it('links to the destinations it is given', () => {
    render(<AuthButtons {...destinations} />);

    expect(
      screen.getByRole('link', { name: 'Sign in' }).getAttribute('href'),
    ).toBe('/enter');
    expect(
      screen.getByRole('link', { name: 'Sign up' }).getAttribute('href'),
    ).toBe('/join');
  });

  it('records the variant it rendered', () => {
    const { container } = render(
      <AuthButtons {...destinations} variant="hero" />,
    );

    expect(
      container
        .querySelector('[data-slot="auth-buttons"]')
        ?.getAttribute('data-variant'),
    ).toBe('hero');
  });

  it('keeps Sign up filled outside the quiet path', () => {
    render(<AuthButtons {...destinations} quietPathPrefix="/account" />);

    expect(screen.getByRole('link', { name: 'Sign up' }).className).toContain(
      'bg-primary-foreground',
    );
  });

  it('goes quiet under the quiet path and marks the open page', () => {
    pathname = '/account/enter';
    render(
      <AuthButtons
        signInHref="/account/enter"
        signUpHref="/account/join"
        quietPathPrefix="/account"
      />,
    );

    const signIn = screen.getByRole('link', { name: 'Sign in' });
    const signUp = screen.getByRole('link', { name: 'Sign up' });

    expect(signIn.getAttribute('aria-current')).toBe('page');
    expect(signIn.className).toContain('underline');
    expect(signUp.className).not.toContain('bg-primary-foreground');
  });

  it('never goes quiet when no quiet path is given', () => {
    pathname = '/auth/login';
    render(
      <AuthButtons signInHref="/auth/login" signUpHref="/auth/register" />,
    );

    expect(screen.getByRole('link', { name: 'Sign up' }).className).toContain(
      'bg-primary-foreground',
    );
  });

  it('does not go quiet in the hero variant', () => {
    pathname = '/account/enter';
    render(
      <AuthButtons
        {...destinations}
        variant="hero"
        quietPathPrefix="/account"
      />,
    );

    expect(screen.getByRole('link', { name: 'Sign up' }).className).toContain(
      'bg-primary-foreground',
    );
  });
});
