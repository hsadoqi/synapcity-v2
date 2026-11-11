import { disconnectAccount, startAccountLink } from './account-operations';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from '@supabase/supabase-js';

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  resend: vi.fn(),
  linkIdentity: vi.fn(),
  getUserIdentities: vi.fn(),
  unlinkIdentity: vi.fn(),
}));

const client = {
  auth: {
    signUp: mocks.signUp,
    resetPasswordForEmail: mocks.resetPasswordForEmail,
    getUser: mocks.getUser,
    updateUser: mocks.updateUser,
    resend: mocks.resend,
    linkIdentity: mocks.linkIdentity,
    getUserIdentities: mocks.getUserIdentities,
    unlinkIdentity: mocks.unlinkIdentity,
  },
} as never;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('startAccountLink', () => {
  const input = {
    provider: 'github' as const,
    redirectTo: 'https://app.test/auth/callback?next=%2Fu%2Fsettings&flow=link',
  };

  it('asks the provider to link, returning to the callback, and hands back where to send the browser', async () => {
    mocks.linkIdentity.mockResolvedValue({
      data: {
        provider: 'github',
        url: 'https://github.com/login/oauth/authorize?x=1',
      },
      error: null,
    });

    const outcome = await startAccountLink(client, input);

    expect(mocks.linkIdentity).toHaveBeenCalledExactlyOnceWith({
      provider: 'github',
      options: { redirectTo: input.redirectTo },
    });
    expect(outcome).toEqual({
      kind: 'redirect',
      url: 'https://github.com/login/oauth/authorize?x=1',
    });
  });

  it('tells a missing session from an unreachable service', async () => {
    mocks.linkIdentity.mockResolvedValue({
      data: { provider: 'github', url: null },
      error: new AuthSessionMissingError(),
    });
    expect(await startAccountLink(client, input)).toEqual({
      kind: 'signed-out',
    });

    mocks.linkIdentity.mockResolvedValue({
      data: { provider: 'github', url: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(await startAccountLink(client, input)).toEqual({
      kind: 'unavailable',
    });
  });

  it('reduces a provider error to its code, such as linking being switched off', async () => {
    mocks.linkIdentity.mockResolvedValue({
      data: { provider: 'github', url: null },
      error: new AuthApiError('sentinel', 422, 'manual_linking_disabled'),
    });

    const outcome = await startAccountLink(client, input);

    expect(outcome).toEqual({
      kind: 'provider-error',
      code: 'manual_linking_disabled',
    });
    expect(JSON.stringify(outcome)).not.toContain('sentinel');
  });

  it('does not send the browser anywhere when there is no address to send it to', async () => {
    mocks.linkIdentity.mockResolvedValue({
      data: { provider: 'github', url: null },
      error: null,
    });

    expect(await startAccountLink(client, input)).toEqual({
      kind: 'provider-error',
      code: undefined,
    });
  });
});

describe('disconnectAccount', () => {
  const email = { identity_id: 'i-1', provider: 'email', identity_data: {} };
  const github = {
    identity_id: 'i-2',
    provider: 'github',
    identity_data: { user_name: 'ada-l' },
  };
  const google = { identity_id: 'i-3', provider: 'google', identity_data: {} };
  const has = (...identities: object[]) =>
    mocks.getUserIdentities.mockResolvedValue({
      data: { identities },
      error: null,
    });

  beforeEach(() => {
    mocks.unlinkIdentity.mockResolvedValue({ data: {}, error: null });
  });

  it("unlinks the person's own identity record for that provider, found here and not sent by the caller", async () => {
    has(email, github);

    const outcome = await disconnectAccount(client, { provider: 'github' });

    expect(mocks.unlinkIdentity).toHaveBeenCalledExactlyOnceWith(github);
    expect(outcome).toEqual({ kind: 'disconnected' });
  });

  it('can disconnect one of two connected accounts with no password', async () => {
    has(google, github);

    expect(await disconnectAccount(client, { provider: 'google' })).toEqual({
      kind: 'disconnected',
    });
    expect(mocks.unlinkIdentity).toHaveBeenCalledExactlyOnceWith(google);
  });

  it('refuses to remove the only way to sign in, and changes nothing', async () => {
    has(github);

    expect(await disconnectAccount(client, { provider: 'github' })).toEqual({
      kind: 'last-sign-in',
    });
    expect(mocks.unlinkIdentity).not.toHaveBeenCalled();
  });

  it('says so when it is not connected, and changes nothing', async () => {
    has(email, github);

    expect(await disconnectAccount(client, { provider: 'google' })).toEqual({
      kind: 'not-connected',
    });
    expect(mocks.unlinkIdentity).not.toHaveBeenCalled();
  });

  it.each([
    ['single_identity_not_deletable', { kind: 'last-sign-in' }],
    ['identity_not_found', { kind: 'not-connected' }],
    [
      'manual_linking_disabled',
      { kind: 'provider-error', code: 'manual_linking_disabled' },
    ],
  ])('maps the provider refusing with %s', async (code, expected) => {
    has(email, github);
    mocks.unlinkIdentity.mockResolvedValue({
      data: null,
      error: new AuthApiError('sentinel', 422, code),
    });

    const outcome = await disconnectAccount(client, { provider: 'github' });

    expect(outcome).toEqual(expected);
    expect(JSON.stringify(outcome)).not.toContain('sentinel');
  });

  it('tells a missing session from an outage when listing', async () => {
    mocks.getUserIdentities.mockResolvedValue({
      data: null,
      error: new AuthSessionMissingError(),
    });
    expect(await disconnectAccount(client, { provider: 'github' })).toEqual({
      kind: 'signed-out',
    });

    mocks.getUserIdentities.mockResolvedValue({
      data: null,
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(await disconnectAccount(client, { provider: 'github' })).toEqual({
      kind: 'unavailable',
    });
    expect(mocks.unlinkIdentity).not.toHaveBeenCalled();
  });

  it('reports an outage while unlinking as unavailable', async () => {
    has(email, github);
    mocks.unlinkIdentity.mockResolvedValue({
      data: null,
      error: new AuthRetryableFetchError('fetch failed', 0),
    });

    expect(await disconnectAccount(client, { provider: 'github' })).toEqual({
      kind: 'unavailable',
    });
  });
});
