import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), getClaims: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser, getClaims: mocks.getClaims },
  }),
}));

import { getPendingEmail } from './session';

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
