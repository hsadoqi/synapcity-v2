import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  resend: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));

import { AuthRetryableFetchError } from '@supabase/supabase-js';

import {
  changeEmail,
  registerWithPassword,
  requestRecoveryEmail,
  resendEmailChange,
  sendOwnPasswordReset,
} from './operations';

const PASSWORD = 'sentinel-password-9f3a';
const ACCESS_TOKEN = 'sentinel-access-token';
const REFRESH_TOKEN = 'sentinel-refresh-token';

const registration = {
  email: 'ada@example.com',
  password: PASSWORD,
  name: 'Ada Lovelace',
  confirmationRedirect: 'https://app.test/auth/callback?next=&flow=confirm',
};

/** What the SDK would hand back when a session exists. */
const sdkUser = {
  id: 'user-1',
  email: 'ada@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: { full_name: 'Ada Lovelace' },
};
const sdkSession = {
  access_token: ACCESS_TOKEN,
  refresh_token: REFRESH_TOKEN,
  user: sdkUser,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockImplementation(async () => ({
    auth: {
      signUp: mocks.signUp,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      getUser: mocks.getUser,
      updateUser: mocks.updateUser,
      resend: mocks.resend,
    },
  }));
});

describe('registerWithPassword', () => {
  it('sends the confirmation redirect and the name as full_name', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: sdkUser, session: null },
      error: null,
    });

    await registerWithPassword(registration);

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: PASSWORD,
      options: {
        emailRedirectTo: registration.confirmationRedirect,
        data: { full_name: 'Ada Lovelace' },
      },
    });
  });

  it('reports confirmation-required when no session was issued', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: sdkUser, session: null },
      error: null,
    });

    expect(await registerWithPassword(registration)).toEqual({
      kind: 'confirmation-required',
    });
  });

  it('reports the user id when the project issues a session at once', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: sdkUser, session: sdkSession },
      error: null,
    });

    const outcome = await registerWithPassword(registration);

    expect(outcome).toEqual({ kind: 'signed-in', userId: 'user-1' });
    // Exactly the allowed shape: nothing else may ride along.
    expect(Object.keys(outcome).sort()).toEqual(['kind', 'userId']);
  });

  it('reports a provider error as its code only', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        code: 'weak_password',
        message: 'Password is too weak for user ada@example.com',
        status: 422,
      },
    });

    const outcome = await registerWithPassword(registration);

    expect(outcome).toEqual({ kind: 'provider-error', code: 'weak_password' });
    expect(JSON.stringify(outcome)).not.toContain('ada@example.com');
  });

  it('tolerates a provider error that has no code', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'boom' },
    });

    expect(await registerWithPassword(registration)).toEqual({
      kind: 'provider-error',
      code: undefined,
    });
  });

  it.each([
    ['no session', { user: sdkUser, session: null }],
    ['a session', { user: sdkUser, session: sdkSession }],
  ])(
    'never carries credentials, tokens or the raw user (%s)',
    async (_, data) => {
      mocks.signUp.mockResolvedValue({ data, error: null });

      const text = JSON.stringify(await registerWithPassword(registration));

      for (const secret of [
        PASSWORD,
        ACCESS_TOKEN,
        REFRESH_TOKEN,
        'ada@example.com',
        'app_metadata',
      ]) {
        expect(text).not.toContain(secret);
      }
    },
  );

  it('builds a fresh request-bound client for every call', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: sdkUser, session: null },
      error: null,
    });

    await registerWithPassword(registration);
    await registerWithPassword(registration);

    expect(mocks.createClient).toHaveBeenCalledTimes(2);
  });
});

describe('requestRecoveryEmail', () => {
  const recovery = {
    email: 'ada@example.com',
    resetRedirect:
      'https://app.test/auth/callback?next=%2Fauth%2Fupdate-password&flow=reset',
  };

  it('asks for the reset email with the reset redirect', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });

    await requestRecoveryEmail(recovery);

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      'ada@example.com',
      { redirectTo: recovery.resetRedirect },
    );
  });

  it('accepts on success', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });

    expect(await requestRecoveryEmail(recovery)).toEqual({ kind: 'accepted' });
  });

  it.each(['over_email_send_rate_limit', 'over_request_rate_limit'])(
    'reports the %s limit, and only its code',
    async (code) => {
      mocks.resetPasswordForEmail.mockResolvedValue({
        error: { code, message: 'secret provider text', status: 429 },
      });

      const outcome = await requestRecoveryEmail(recovery);

      expect(outcome).toEqual({ kind: 'rate-limited', code });
      expect(JSON.stringify(outcome)).not.toContain('secret provider text');
    },
  );

  it.each(['user_not_found', 'email_address_invalid', undefined])(
    'answers the same as success for the provider error %j',
    async (code) => {
      mocks.resetPasswordForEmail.mockResolvedValue({
        error: { code, message: 'reveals whether the account exists' },
      });

      expect(await requestRecoveryEmail(recovery)).toEqual({
        kind: 'accepted',
      });
    },
  );

  it('builds a fresh request-bound client for every call', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });

    await requestRecoveryEmail(recovery);
    await requestRecoveryEmail(recovery);

    expect(mocks.createClient).toHaveBeenCalledTimes(2);
  });
});

describe('changeEmail', () => {
  const input = {
    newEmail: 'grace@example.com',
    redirectTo:
      'https://app.test/auth/callback?next=%2Fu%2Fsettings&flow=email-change',
  };
  const user = (extra: Record<string, unknown> = {}) => ({
    data: { user: { id: 'user-1', email: 'ada@example.com', ...extra } },
    error: null,
  });

  it('asks for the change with the redirect, once, and reports only that it was requested', async () => {
    mocks.getUser.mockResolvedValue(user());
    mocks.updateUser.mockResolvedValue({ data: {}, error: null });

    const outcome = await changeEmail(input);

    expect(mocks.updateUser).toHaveBeenCalledExactlyOnceWith(
      { email: 'grace@example.com' },
      { emailRedirectTo: input.redirectTo },
    );
    expect(outcome).toEqual({ kind: 'requested' });
  });

  it('reports a link was requested when the provider is holding the change as pending', async () => {
    mocks.getUser.mockResolvedValue(user());
    mocks.updateUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'ada@example.com',
          new_email: 'grace@example.com',
        },
      },
      error: null,
    });

    expect(await changeEmail(input)).toEqual({ kind: 'requested' });
  });

  it('reports the address as changed when the project applies it at once, with nothing pending', async () => {
    mocks.getUser.mockResolvedValue(user());
    mocks.updateUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'Grace@Example.com' } },
      error: null,
    });

    expect(await changeEmail(input)).toEqual({ kind: 'changed' });
  });

  it('does not call it changed when the address on the account is still the old one', async () => {
    mocks.getUser.mockResolvedValue(user());
    mocks.updateUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'ada@example.com' } },
      error: null,
    });

    expect(await changeEmail(input)).toEqual({ kind: 'requested' });
  });

  it("compares with the provider's current address, ignoring case", async () => {
    mocks.getUser.mockResolvedValue(user());

    expect(
      await changeEmail({ ...input, newEmail: 'ADA@Example.com' }),
    ).toEqual({
      kind: 'same-email',
    });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('tells a missing session from an unreachable service', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });
    expect(await changeEmail(input)).toEqual({ kind: 'signed-out' });

    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(await changeEmail(input)).toEqual({ kind: 'unavailable' });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('reduces a provider error to its code, with no SDK object in the outcome', async () => {
    mocks.getUser.mockResolvedValue(user());
    mocks.updateUser.mockResolvedValue({
      data: {},
      error: { code: 'email_exists', message: 'sentinel-message', status: 422 },
    });

    const outcome = await changeEmail(input);

    expect(outcome).toEqual({ kind: 'provider-error', code: 'email_exists' });
    expect(JSON.stringify(outcome)).not.toContain('sentinel');
  });
});

describe('resendEmailChange', () => {
  const redirectTo = 'https://app.test/auth/callback?flow=email-change';

  it('sends to the pending address the provider holds', async () => {
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
    mocks.resend.mockResolvedValue({ data: {}, error: null });

    const outcome = await resendEmailChange({ redirectTo });

    expect(mocks.resend).toHaveBeenCalledExactlyOnceWith({
      type: 'email_change',
      email: 'grace@example.com',
      options: { emailRedirectTo: redirectTo },
    });
    expect(outcome).toEqual({ kind: 'sent', email: 'grace@example.com' });
  });

  it('has nothing to send when no change is pending', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'ada@example.com' } },
      error: null,
    });

    expect(await resendEmailChange({ redirectTo })).toEqual({
      kind: 'nothing-pending',
    });
    expect(mocks.resend).not.toHaveBeenCalled();
  });

  it('tells a missing session from an unreachable service', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });
    expect(await resendEmailChange({ redirectTo })).toEqual({
      kind: 'signed-out',
    });

    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(await resendEmailChange({ redirectTo })).toEqual({
      kind: 'unavailable',
    });
  });

  it('reduces a provider error to its code', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'u', new_email: 'grace@example.com' } },
      error: null,
    });
    mocks.resend.mockResolvedValue({
      data: {},
      error: { code: 'over_email_send_rate_limit', message: 'sentinel' },
    });

    const outcome = await resendEmailChange({ redirectTo });

    expect(outcome).toEqual({
      kind: 'provider-error',
      code: 'over_email_send_rate_limit',
    });
    expect(JSON.stringify(outcome)).not.toContain('sentinel');
  });
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

    const outcome = await sendOwnPasswordReset({ resetRedirect });

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledExactlyOnceWith(
      'ada@example.com',
      { redirectTo: resetRedirect },
    );
    expect(outcome).toEqual({ kind: 'sent', email: 'ada@example.com' });
  });

  it('takes no address from the caller, so it cannot be aimed elsewhere', async () => {
    signedIn();
    mocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    await sendOwnPasswordReset({
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

    expect(await sendOwnPasswordReset({ resetRedirect })).toEqual({
      kind: 'no-email',
    });
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('tells a missing session from an unreachable service', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });
    expect(await sendOwnPasswordReset({ resetRedirect })).toEqual({
      kind: 'signed-out',
    });

    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(await sendOwnPasswordReset({ resetRedirect })).toEqual({
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
    const limited = await sendOwnPasswordReset({ resetRedirect });
    expect(limited).toEqual({
      kind: 'rate-limited',
      code: 'over_email_send_rate_limit',
    });

    mocks.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { code: 'unexpected_failure', message: 'sentinel' },
    });
    const failed = await sendOwnPasswordReset({ resetRedirect });
    expect(failed).toEqual({
      kind: 'provider-error',
      code: 'unexpected_failure',
    });
    expect(JSON.stringify([limited, failed])).not.toContain('sentinel');
  });
});
