import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendOwnPasswordReset } from './password-operations';
import {
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

describe('sendOwnPasswordReset', () => {
  const resetRedirect =
    'https://app.test/auth/callback?next=%2Fauth%2Fupdate-password&flow=reset';
  const signedIn = (email: string | null = 'ada@example.com') =>
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: email ?? undefined } },
      error: null,
    });

  it("sends the link to the account's own address, read from the provider", async () => {
    signedIn();
    mocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const outcome = await sendOwnPasswordReset(client, { resetRedirect });

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledExactlyOnceWith(
      'ada@example.com',
      { redirectTo: resetRedirect },
    );
    expect(outcome).toEqual({ kind: 'sent', email: 'ada@example.com' });
  });

  it('takes no address from the caller, so it cannot be aimed elsewhere', async () => {
    signedIn();
    mocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    await sendOwnPasswordReset(client, {
      resetRedirect,
      // @ts-expect-error: there is deliberately no such input
      email: 'attacker@evil.test',
    });

    expect(
      JSON.stringify(mocks.resetPasswordForEmail.mock.calls),
    ).not.toContain('attacker');
  });

  it('has nothing to send to when the account has no email', async () => {
    signedIn(null);

    expect(await sendOwnPasswordReset(client, { resetRedirect })).toEqual({
      kind: 'no-email',
    });
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('tells a missing session from an unreachable service', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      // What auth-js returns for a `session_not_found` answer.
      error: new AuthSessionMissingError(),
    });
    expect(await sendOwnPasswordReset(client, { resetRedirect })).toEqual({
      kind: 'signed-out',
    });

    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(await sendOwnPasswordReset(client, { resetRedirect })).toEqual({
      kind: 'unavailable',
    });
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('separates a rate limit from any other failure, and keeps SDK objects out of the outcome', async () => {
    signedIn();
    mocks.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { code: 'over_email_send_rate_limit', message: 'sentinel' },
    });
    const limited = await sendOwnPasswordReset(client, { resetRedirect });
    expect(limited).toEqual({
      kind: 'rate-limited',
      code: 'over_email_send_rate_limit',
    });

    mocks.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { code: 'unexpected_failure', message: 'sentinel' },
    });
    const failed = await sendOwnPasswordReset(client, { resetRedirect });
    expect(failed).toEqual({
      kind: 'provider-error',
      code: 'unexpected_failure',
    });
    expect(JSON.stringify([limited, failed])).not.toContain('sentinel');
  });
});
