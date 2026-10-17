import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), getClaims: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser, getClaims: mocks.getClaims },
  }),
}));

import { getConnectedAccounts, getPendingEmail } from './session';

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
