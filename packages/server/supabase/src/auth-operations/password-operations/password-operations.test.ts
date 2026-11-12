import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  changeEmail,
  resendEmailChange,
  sendOwnPasswordReset,
} from './password-operations';
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
      failure: { status: 0 },
    });
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('separates a rate limit from any other failure, and keeps SDK objects out of the outcome', async () => {
    signedIn();
    mocks.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: new AuthApiError('sentinel', 429, 'over_email_send_rate_limit'),
    });
    const limited = await sendOwnPasswordReset(client, { resetRedirect });
    expect(limited).toEqual({
      kind: 'rate-limited',
      code: 'over_email_send_rate_limit',
    });

    mocks.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: new AuthApiError('sentinel', 422, 'unexpected_failure'),
    });
    const failed = await sendOwnPasswordReset(client, { resetRedirect });
    expect(failed).toEqual({
      kind: 'provider-error',
      code: 'unexpected_failure',
    });
    expect(JSON.stringify([limited, failed])).not.toContain('sentinel');
  });
});

/*
 * The second provider call of each operation (after the user was read) goes
 * through the shared Auth classification: a lost session is not a provider
 * refusal, an outage is not either and keeps its code and status for the log,
 * and a rate limit stays apart from an outage.
 */
describe('second-call Auth failures', () => {
  const withPending = () =>
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'ada@example.com',
          new_email: 'grace@example.com',
        },
      },
      error: null,
    });

  const OPERATIONS = [
    {
      name: 'changeEmail',
      call: mocks.updateUser,
      run: () =>
        changeEmail(client, {
          newEmail: 'new@example.com',
          redirectTo: 'https://app.test/r',
        }),
      rateLimited: {
        kind: 'provider-error',
        code: 'over_email_send_rate_limit',
      },
    },
    {
      name: 'resendEmailChange',
      call: mocks.resend,
      run: () =>
        resendEmailChange(client, { redirectTo: 'https://app.test/r' }),
      rateLimited: {
        kind: 'provider-error',
        code: 'over_email_send_rate_limit',
      },
    },
    {
      name: 'sendOwnPasswordReset',
      call: mocks.resetPasswordForEmail,
      run: () =>
        sendOwnPasswordReset(client, { resetRedirect: 'https://app.test/r' }),
      rateLimited: { kind: 'rate-limited', code: 'over_email_send_rate_limit' },
    },
  ] as const;

  describe.each(OPERATIONS)('$name', ({ call, run, rateLimited }) => {
    beforeEach(() => withPending());

    it('reads a rejected session as signed out, not as a provider error', async () => {
      call.mockResolvedValue({
        data: {},
        error: new AuthSessionMissingError(),
      });
      await expect(run()).resolves.toEqual({ kind: 'signed-out' });
    });

    it('reads an outage as unavailable, with its code and status only', async () => {
      call.mockResolvedValue({
        data: {},
        error: new AuthRetryableFetchError('secret outage', 503),
      });
      const outcome = await run();
      expect(outcome).toStrictEqual({
        kind: 'unavailable',
        failure: { status: 503 },
      });
      expect(JSON.stringify(outcome)).not.toContain('secret');
    });

    it('keeps a rate limit apart from an outage', async () => {
      call.mockResolvedValue({
        data: {},
        error: new AuthApiError('slow down', 429, 'over_email_send_rate_limit'),
      });
      await expect(run()).resolves.toEqual(rateLimited);
    });

    it('carries the code of a refusal', async () => {
      call.mockResolvedValue({
        data: {},
        error: new AuthApiError('secret', 422, 'validation_failed'),
      });
      await expect(run()).resolves.toStrictEqual({
        kind: 'provider-error',
        code: 'validation_failed',
      });
    });
  });
});
