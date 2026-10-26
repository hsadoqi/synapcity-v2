import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
}));

vi.mock('@/features/auth/server', () => ({
  getVerifiedClaims: async () => mocks.claims,
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url });
  },
}));

import DeleteAccountPage from './page';
import { DeleteAccountCard } from '@synapcity/features-auth/frontend';
import { MessagePage } from '@synapcity/frontend-shells';

const NOW = 1_800_000_000;

describe('the delete-account page', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW * 1000);
    mocks.claims = {
      sub: 'u1',
      email: 'ada@example.com',
      amr: [{ method: 'otp', timestamp: NOW - 30 }],
    };
  });

  it('sends a signed-out visitor to sign in', async () => {
    mocks.claims = null;

    await expect(DeleteAccountPage()).rejects.toMatchObject({
      url: '/auth/login',
    });
  });

  it('shows the final button after a link sign-in a moment ago', async () => {
    const element = await DeleteAccountPage();

    expect(element.type).toBe(DeleteAccountCard);
    expect(element.props).toMatchObject({
      email: 'ada@example.com',
      settingsHref: '/u1/settings',
    });
  });

  it.each([
    ['a password sign-in only', [{ method: 'password', timestamp: NOW - 5 }]],
    [
      'a link sign-in that has gone stale',
      [{ method: 'otp', timestamp: NOW - 3600 }],
    ],
    ['no sign-in methods in the token', undefined],
  ])(
    'asks for a new link after %s, and offers no way to delete',
    async (_label, amr) => {
      mocks.claims = { sub: 'u1', email: 'ada@example.com', amr };

      const element = await DeleteAccountPage();

      expect(element.type).toBe(MessagePage);
      expect(element.props.title).toBe('Ask for a new link');
    },
  );
});
