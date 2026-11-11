import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  resend: vi.fn(),
  linkIdentity: vi.fn(),
  signInWithOtp: vi.fn(),
  getClaims: vi.fn(),
  rpc: vi.fn(),
  signOut: vi.fn(),
  getUserIdentities: vi.fn(),
  unlinkIdentity: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));

import {
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from '@supabase/supabase-js';

import { deleteOwnAccount } from './operations';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockImplementation(async () => ({
    auth: {
      signUp: mocks.signUp,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      getUser: mocks.getUser,
      updateUser: mocks.updateUser,
      resend: mocks.resend,
      linkIdentity: mocks.linkIdentity,
      signInWithOtp: mocks.signInWithOtp,
      getClaims: mocks.getClaims,
      signOut: mocks.signOut,
      getUserIdentities: mocks.getUserIdentities,
      unlinkIdentity: mocks.unlinkIdentity,
    },
    rpc: mocks.rpc,
  }));
});

describe('deleteOwnAccount', () => {
  const NOW_MS = 1_800_000_000_000;
  const NOW = NOW_MS / 1000;
  const claims = (amr: unknown) =>
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: 'user-1', amr } },
      error: null,
    });
  const cleanup = vi.fn();

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW_MS);
    cleanup.mockReset().mockResolvedValue(undefined);
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    mocks.signOut.mockResolvedValue({ error: null });
    claims([{ method: 'otp', timestamp: NOW - 60 }]);
  });

  it('cleans up, deletes through the database function, signs this browser out, in that order', async () => {
    const order: string[] = [];
    cleanup.mockImplementation(async () => void order.push('cleanup'));
    mocks.rpc.mockImplementation(async () => {
      order.push('rpc');
      return { data: null, error: null };
    });
    mocks.signOut.mockImplementation(async () => {
      order.push('signOut');
      return { error: null };
    });

    const outcome = await deleteOwnAccount({ cleanup });

    expect(outcome).toEqual({ kind: 'deleted' });
    expect(order).toEqual(['cleanup', 'rpc', 'signOut']);
    expect(cleanup).toHaveBeenCalledWith(expect.anything(), 'user-1');
    // No argument: nothing to point at somebody else's account.
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('delete_own_account');
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it.each([
    ['a password sign-in only', [{ method: 'password', timestamp: NOW - 5 }]],
    ['a link older than the window', [{ method: 'otp', timestamp: NOW - 601 }]],
    ['no sign-in methods', undefined],
  ])('refuses %s, and touches nothing', async (_label, amr) => {
    claims(amr);

    expect(await deleteOwnAccount({ cleanup })).toEqual({
      kind: 'link-required',
    });
    expect(cleanup).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('treats the database refusing as needing the link, and does not sign out', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'sentinel' },
    });

    expect(await deleteOwnAccount({ cleanup })).toEqual({
      kind: 'link-required',
    });
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it('reports any other database failure by code only, and does not sign out', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'sentinel' },
    });

    const outcome = await deleteOwnAccount({ cleanup });

    expect(outcome).toEqual({ kind: 'provider-error', code: 'PGRST202' });
    expect(JSON.stringify(outcome)).not.toContain('sentinel');
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it('still deletes when the cleanup fails: an orphaned file beats an account that cannot be deleted', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    cleanup.mockRejectedValue(new Error('storage down'));

    expect(await deleteOwnAccount({ cleanup })).toEqual({ kind: 'deleted' });
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });

  it('is deleted even if clearing the cookies throws afterwards', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.signOut.mockRejectedValue(new Error('network'));

    expect(await deleteOwnAccount({ cleanup })).toEqual({ kind: 'deleted' });
  });

  it('tells a missing session from an outage, and deletes nothing in either case', async () => {
    mocks.getClaims.mockResolvedValue({
      data: null,
      error: new AuthSessionMissingError(),
    });
    expect(await deleteOwnAccount({ cleanup })).toEqual({
      kind: 'signed-out',
    });

    mocks.getClaims.mockResolvedValue({
      data: null,
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(await deleteOwnAccount({ cleanup })).toEqual({
      kind: 'unavailable',
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
