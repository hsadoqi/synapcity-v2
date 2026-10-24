import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getClaims: vi.fn(),
  createClient: vi.fn(),
}));

// `cache` would carry one test's result into the next; each call is fresh here.
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T>(fn: T) => fn,
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    mocks.createClient();
    return { auth: { getUser: mocks.getUser, getClaims: mocks.getClaims } };
  },
}));

import {
  getConnectedAccounts,
  getCurrentUser,
  getPendingEmail,
  getVerifiedClaims,
  getVerifiedIdentity,
} from './session';

describe('session', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it('verifies claims with the provider and never returns a fixture', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
    mocks.getClaims.mockResolvedValue({ data: null });

    await expect(getVerifiedClaims()).resolves.toBeNull();
    expect(mocks.getClaims).toHaveBeenCalledOnce();
  });

  it('shows the fixture user for display in fixture mode without Supabase', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');

    const user = await getCurrentUser();

    expect(user).toMatchObject({ id: 'fixture-user', fixture: true });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('reads no provider record in fixture mode', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');

    await expect(getPendingEmail()).resolves.toBeNull();
    await expect(getConnectedAccounts()).resolves.toEqual([]);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('derives the display user from verified claims otherwise', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    mocks.getClaims.mockResolvedValue({
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
    mocks.getClaims.mockResolvedValue({ data: null });

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(mocks.getClaims).toHaveBeenCalled();
  });
});

describe('getVerifiedIdentity', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it('is the verified subject of the session claims', async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: 'u1' } } });

    await expect(getVerifiedIdentity()).resolves.toEqual({
      status: 'verified',
      identity: { userId: 'u1' },
    });
  });

  it('is signed out without a session', async () => {
    mocks.getClaims.mockResolvedValue({ data: null });

    await expect(getVerifiedIdentity()).resolves.toEqual({
      status: 'signed-out',
    });
  });

  it('is signed out, not unavailable, when the claims check fails', async () => {
    mocks.getClaims.mockResolvedValue({
      data: null,
      error: { code: 'bad_jwt', status: 401 },
    });

    await expect(getVerifiedIdentity()).resolves.toEqual({
      status: 'signed-out',
    });
  });

  it('asks the provider in fixture mode and never returns the fixture user', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
    mocks.getClaims.mockResolvedValue({ data: null });

    await expect(getVerifiedIdentity()).resolves.toEqual({
      status: 'signed-out',
    });
    expect(mocks.getClaims).toHaveBeenCalledOnce();
  });
});

describe('getPendingEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is the address the provider says a change is waiting on', async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'u1',
          email: 'ada@example.com',
          new_email: 'grace@example.com',
        },
      },
      error: null,
    });

    expect(await getPendingEmail()).toBe('grace@example.com');
  });

  it('is null when no change is waiting', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'ada@example.com' } },
      error: null,
    });

    expect(await getPendingEmail()).toBeNull();
  });

  it('is null, not an error, when there is no session', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });

    expect(await getPendingEmail()).toBeNull();
  });
});

describe('getConnectedAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists the linked Google and GitHub accounts as display rows, nothing more', async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'u1',
          identities: [
            { provider: 'email', identity_data: { email: 'ada@example.com' } },
            {
              provider: 'github',
              identity_data: { user_name: 'ada-l', secret: 'sentinel-token' },
            },
          ],
        },
      },
      error: null,
    });

    const accounts = await getConnectedAccounts();

    expect(accounts).toEqual([{ provider: 'github', detail: 'ada-l' }]);
    expect(JSON.stringify(accounts)).not.toContain('sentinel');
  });

  it('is empty when nothing is linked, there are no identities, or there is no session', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1', identities: [] } },
      error: null,
    });
    expect(await getConnectedAccounts()).toEqual([]);

    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    });
    expect(await getConnectedAccounts()).toEqual([]);

    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });
    expect(await getConnectedAccounts()).toEqual([]);
  });
});
