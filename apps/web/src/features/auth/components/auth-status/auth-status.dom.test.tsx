import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), signOut: vi.fn() }));

vi.mock('@/features/auth/server/session', () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock('@/features/auth/server/actions/actions', () => ({
  signOut: mocks.signOut,
}));

import { AuthStatus } from './auth-status';

const user = {
  id: 'u1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  imageUrl: null,
};

// AuthStatus is an async server component: await it, then render the result.
const show = async (variant?: 'header' | 'hero') =>
  render(await AuthStatus({ variant }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthStatus', () => {
  describe('signed out', () => {
    beforeEach(() => mocks.getCurrentUser.mockResolvedValue(null));

    it('offers sign in and sign up', async () => {
      await show();

      expect(
        screen
          .getByRole('link', { name: /sign in|log in/i })
          .getAttribute('href'),
      ).toBe('/auth/login');
      expect(
        screen
          .getByRole('link', { name: /sign up|get started|register/i })
          .getAttribute('href'),
      ).toBe('/auth/register');
    });
  });

  describe('signed in', () => {
    beforeEach(() => mocks.getCurrentUser.mockResolvedValue(user));

    it('links the hero straight to the workspace', async () => {
      await show('hero');

      expect(
        screen
          .getByRole('link', { name: 'Go to your workspace' })
          .getAttribute('href'),
      ).toBe('/u1/home');
    });

    it('shows the account menu in the header, not the workspace link', async () => {
      await show('header');

      expect(
        screen.queryByRole('link', { name: 'Go to your workspace' }),
      ).toBeNull();
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('does not offer sign in or sign up', async () => {
      await show('header');

      expect(
        screen.queryByRole('link', { name: /sign in|sign up/i }),
      ).toBeNull();
    });
  });

  it('asks for the user once', async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await show();

    expect(mocks.getCurrentUser).toHaveBeenCalledTimes(1);
  });
});
