import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

// Any session read or redirect from a presentation layout is a failure.
const forbidden = vi.hoisted(() => ({
  sessionRead: vi.fn(() => {
    throw new Error('a presentation layout read the session');
  }),
  redirect: vi.fn(() => {
    throw new Error('a presentation layout redirected');
  }),
}));
vi.mock('@/features/auth/server', () => ({
  getVerifiedClaims: forbidden.sessionRead,
  getCurrentUser: forbidden.sessionRead,
}));
vi.mock('@/lib/access/require-signed-in', () => ({
  requireSignedIn: forbidden.sessionRead,
}));
vi.mock('next/navigation', () => ({
  redirect: forbidden.redirect,
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/features/auth/components/auth-status', () => ({
  AuthStatus: () => <button type="button">Account menu</button>,
}));
vi.mock('@synapcity/frontend-error-reports', () => ({
  reportCaughtError: vi.fn(),
}));

import AuthLayout from './(auth)/layout';
import AuthNotFound from './(auth)/not-found';
import PublicLayout from './(public)/layout';
import PublicNotFound from './(public)/not-found';
import RootNotFound from './not-found';
import RootError from './error';

const inLayout =
  (Layout: (props: { children: ReactNode }) => ReactNode) =>
  (page: ReactNode) =>
    render(<Layout>{page}</Layout>);

describe('the public and auth layouts', () => {
  it.each([
    ['(public)', PublicLayout],
    ['(auth)', AuthLayout],
  ])(
    '%s gives the page the public shell without reading the session',
    (_name, Layout) => {
      inLayout(Layout)(<h1>Page</h1>);

      expect(
        document.querySelectorAll('[data-slot="public-shell"]'),
      ).toHaveLength(1);
      expect(
        document.querySelector('[data-slot="authenticated-shell"]'),
      ).toBeNull();
      expect(screen.getByRole('banner')).toBeTruthy();
      expect(
        within(screen.getByRole('main')).getByRole('heading', { name: 'Page' }),
      ).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Account menu' })).toBeTruthy();
      expect(forbidden.sessionRead).not.toHaveBeenCalled();
      expect(forbidden.redirect).not.toHaveBeenCalled();
    },
  );

  it('(auth) centres the page in one narrow column', () => {
    inLayout(AuthLayout)(<h1>Sign in</h1>);

    const column = screen.getByRole('heading', {
      name: 'Sign in',
    }).parentElement;
    expect(column?.className).toMatch(/\bmax-w-md\b/);
  });
});

describe('boundaries inside a group do not nest a second shell', () => {
  it.each([
    ['(public)', PublicLayout, PublicNotFound],
    ['(auth)', AuthLayout, AuthNotFound],
  ])(
    '%s not-found renders in the group layout with one banner and one main',
    (_name, Layout, NotFound) => {
      inLayout(Layout)(<NotFound />);

      expect(screen.getAllByRole('banner')).toHaveLength(1);
      expect(screen.getAllByRole('main')).toHaveLength(1);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(
        document.querySelectorAll('[data-slot="public-shell"]'),
      ).toHaveLength(1);
    },
  );
});

describe('the root boundaries stand on their own', () => {
  it('not-found brings one public shell for an address no group matches', () => {
    render(<RootNotFound />);

    expect(
      document.querySelectorAll('[data-slot="public-shell"]'),
    ).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(
      screen
        .getByRole('link', { name: 'Go to the home page' })
        .getAttribute('href'),
    ).toBe('/');
    expect(forbidden.sessionRead).not.toHaveBeenCalled();
  });

  it('the error boundary brings one public shell and a way to retry', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const retry = vi.fn();
    render(<RootError error={new Error('boom')} retry={retry} />);

    expect(
      document.querySelectorAll('[data-slot="public-shell"]'),
    ).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    screen.getByRole('button', { name: 'Try again' }).click();
    expect(retry).toHaveBeenCalledOnce();
    expect(forbidden.sessionRead).not.toHaveBeenCalled();
  });
});
