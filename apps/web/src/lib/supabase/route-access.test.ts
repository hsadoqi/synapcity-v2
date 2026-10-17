import { describe, expect, it } from 'vitest';

import { isGuestOnlyPath, isProtectedPath } from './route-access';

describe('isProtectedPath', () => {
  it.each([
    '/0b1d6f0e/home',
    '/0b1d6f0e/home/',
    '/0b1d6f0e/home/settings',
    '/0b1d6f0e/home/a/b',
    '/0b1d6f0e/settings',
    '/0b1d6f0e/settings/',
    '/0b1d6f0e/settings/account',
  ])('protects %s', (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each([
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/update-password',
    '/auth/callback',
    '/auth/error',
  ])('leaves %s public, or sign-in could never complete', (path) => {
    expect(isProtectedPath(path)).toBe(false);
  });

  it.each([
    '/homepage',
    '/home-assistant',
    '/homes',
    '/0b1d6f0e/homepage',
    '/0b1d6f0e/home-assistant',
    '/0b1d6f0e/settingsx',
    '/auth/home',
    '/auth/settings',
  ])(
    'does not protect %s just because it starts with or contains "home"',
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    },
  );
});

describe('isGuestOnlyPath', () => {
  it.each(['/auth/login', '/auth/register'])('marks %s guest-only', (path) => {
    expect(isGuestOnlyPath(path)).toBe(true);
  });

  it.each([
    '/',
    '/0b1d6f0e/home',
    '/auth/callback',
    '/auth/forgot-password',
    '/auth/update-password',
    '/auth/error',
    '/auth/login/extra',
  ])('does not redirect signed-in visitors away from %s', (path) => {
    expect(isGuestOnlyPath(path)).toBe(false);
  });

  it('never marks a path both protected and guest-only', () => {
    for (const path of [
      '/0b1d6f0e/home',
      '/auth/login',
      '/auth/register',
      '/',
    ]) {
      expect(isProtectedPath(path) && isGuestOnlyPath(path)).toBe(false);
    }
  });
});
