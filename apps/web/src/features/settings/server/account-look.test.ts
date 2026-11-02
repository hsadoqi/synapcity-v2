import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  LOOK_COOKIE_NAME,
  lookOf,
  settingsDefaults,
  type Settings,
} from '@synapcity/domain-preferences';

const jar = vi.hoisted(() => ({
  value: undefined as string | undefined,
  set: vi.fn(),
  proto: null as string | null,
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'synapcity-look' && jar.value !== undefined
        ? { name, value: jar.value }
        : undefined,
    set: jar.set,
  }),
  headers: async () =>
    new Headers(jar.proto ? { 'x-forwarded-proto': jar.proto } : {}),
}));

import { clearAccountLook } from './account-look';

const signedIn: Settings = {
  ...settingsDefaults,
  theme: {
    ...settingsDefaults.theme,
    density: 'compact',
    radius: 'sharp',
    bodyFont: 'lora',
  },
};

beforeEach(() => {
  jar.value = undefined;
  jar.proto = null;
  jar.set.mockReset();
});

describe('clearAccountLook', () => {
  it('rewrites the cookie without the account’s fonts and radius, keeping device fields', async () => {
    jar.value = encodeURIComponent(JSON.stringify(lookOf(signedIn)));
    jar.proto = 'https';
    await clearAccountLook();

    expect(jar.set).toHaveBeenCalledOnce();
    const [name, value, options] = jar.set.mock.calls[0]!;
    expect(name).toBe(LOOK_COOKIE_NAME);
    const look = JSON.parse(value);
    expect(look.theme).toMatchObject({
      density: 'compact',
      radius: 'default',
      bodyFont: 'default',
    });
    expect(options).toMatchObject({
      path: '/',
      sameSite: 'lax',
      secure: true,
      httpOnly: false,
    });
  });

  it('writes nothing when there is no cookie, an invalid one, or nothing to reset', async () => {
    await clearAccountLook();
    jar.value = '%E0%A4%A';
    await clearAccountLook();
    jar.value = encodeURIComponent(JSON.stringify(lookOf(settingsDefaults)));
    await clearAccountLook();
    expect(jar.set).not.toHaveBeenCalled();
  });

  it('never throws, so signing out cannot fail on it', async () => {
    jar.value = encodeURIComponent(JSON.stringify(lookOf(signedIn)));
    jar.set.mockImplementation(() => {
      throw new Error('read-only cookies');
    });
    await expect(clearAccountLook()).resolves.toBeUndefined();
  });
});
