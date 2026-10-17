import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getClaims = vi.hoisted(() => vi.fn());
const createClient = vi.hoisted(() => vi.fn());

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T>(fn: T) => fn,
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    createClient();
    return { auth: { getClaims } };
  },
}));

import { getCurrentUser, getVerifiedClaims } from './session';

describe('session', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it('verifies claims with the provider and never returns a fixture', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
    getClaims.mockResolvedValue({ data: null });

    await expect(getVerifiedClaims()).resolves.toBeNull();
    expect(getClaims).toHaveBeenCalledOnce();
  });

  it('shows the fixture user for display in fixture mode without Supabase', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');

    const user = await getCurrentUser();

    expect(user).toMatchObject({ id: 'fixture-user', fixture: true });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('derives the display user from verified claims otherwise', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    getClaims.mockResolvedValue({
      data: { claims: { sub: 'u1', email: 'a@b.co' } },
    });

    await expect(getCurrentUser()).resolves.toMatchObject({
      id: 'u1',
      email: 'a@b.co',
    });
  });

  it('ignores the flag in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
    getClaims.mockResolvedValue({ data: null });

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(getClaims).toHaveBeenCalled();
  });
});
