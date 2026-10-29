import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getClaims = vi.fn();
const requestHeaders = vi.hoisted(() => ({ path: null as string | null }));

vi.mock('next/headers', () => ({
  headers: async () =>
    new Headers(
      requestHeaders.path
        ? { 'x-synapcity-request-path': requestHeaders.path }
        : {},
    ),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getClaims } }),
}));

import { requireSignedIn } from './require-signed-in';

async function failure(): Promise<string> {
  try {
    await requireSignedIn();
  } catch (error) {
    return String((error as { digest?: unknown }).digest ?? '');
  }
  return 'did not throw';
}

describe('requireSignedIn', () => {
  beforeEach(() => {
    getClaims.mockReset();
    requestHeaders.path = null;
  });
  afterEach(() => vi.unstubAllEnvs());

  it('returns without redirecting when claims verify', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'u1' } } });

    await expect(requireSignedIn()).resolves.toBeUndefined();
  });

  it('redirects to sign in when there are no claims', async () => {
    getClaims.mockResolvedValue({ data: null });

    expect(await failure()).toContain('/auth/login');
  });

  it('sends a signed-out visitor to sign in with the page they asked for', async () => {
    getClaims.mockResolvedValue({ data: null });
    requestHeaders.path = '/u1';

    expect(await failure()).toContain('/auth/login?next=%2Fu1');
  });

  it.each([
    '//evil.example/steal',
    '/\\evil.example',
    'https://evil.example',
    '',
  ])('ignores %j as a way back', async (path) => {
    getClaims.mockResolvedValue({ data: null });
    requestHeaders.path = path;

    const digest = await failure();

    expect(digest).toContain('/auth/login');
    expect(digest).not.toContain('next=');
  });

  it('treats a failed claims read as signed out', async () => {
    getClaims.mockResolvedValue({ data: null, error: new Error('expired') });

    expect(await failure()).toContain('/auth/login');
  });

  describe('in development fixture mode', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
    });

    it('lets the request through without reading claims', async () => {
      await expect(requireSignedIn()).resolves.toBeUndefined();
      expect(getClaims).not.toHaveBeenCalled();
    });

    it('is ignored in production even with the flag set', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      getClaims.mockResolvedValue({ data: null });

      expect(await failure()).toContain('/auth/login');
    });
  });
});
