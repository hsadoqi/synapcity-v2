import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ path: '/u1/settings' as string | null }));
vi.mock('next/navigation', () => ({ usePathname: () => mocks.path }));

import { SignInAgain } from './sign-in-again';

const signInHref = (to: string) => `/auth/login?next=${encodeURIComponent(to)}`;

describe('SignInAgain', () => {
  beforeEach(() => {
    mocks.path = '/u1/settings';
  });

  it('links to sign-in and comes back to this page afterwards', () => {
    render(<SignInAgain signInHref={signInHref} />);

    expect(
      screen.getByRole('link', { name: 'Sign in again' }).getAttribute('href'),
    ).toBe('/auth/login?next=%2Fu1%2Fsettings');
  });

  it('encodes the path so it cannot add parameters of its own', () => {
    mocks.path = '/u1/settings?x=1&next=//evil.test';
    render(<SignInAgain signInHref={signInHref} />);

    const href = screen.getByRole('link').getAttribute('href')!;
    const params = new URL(href, 'https://app.test').searchParams;
    expect([...params.keys()]).toEqual(['next']);
    expect(params.get('next')).toBe('/u1/settings?x=1&next=//evil.test');
  });

  it('falls back to the home page when the path is not known', () => {
    mocks.path = null;
    render(<SignInAgain signInHref={signInHref} />);

    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/auth/login?next=%2F',
    );
  });
});
