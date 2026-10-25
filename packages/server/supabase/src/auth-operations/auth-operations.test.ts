import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import {
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from '@supabase/supabase-js';

import {
  changeEmail,
  disconnectAccount,
  registerWithPassword,
  requestRecoveryEmail,
  resendEmailChange,
  sendOwnPasswordReset,
  startAccountLink,
} from './auth-operations';

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

describe('registerWithPassword', () => {
  it('sends the confirmation redirect and the name as full_name', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: sdkUser, session: null },
      error: null,
    });

    await registerWithPassword(client, registration);

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

    expect(await registerWithPassword(client, registration)).toEqual({
      kind: 'confirmation-required',
    });
  });

  it('reports the user id when the project issues a session at once', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: sdkUser, session: sdkSession },
      error: null,
    });

    const outcome = await registerWithPassword(client, registration);

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

    const outcome = await registerWithPassword(client, registration);

    expect(outcome).toEqual({ kind: 'provider-error', code: 'weak_password' });
    expect(JSON.stringify(outcome)).not.toContain('ada@example.com');
  });

  it('tolerates a provider error that has no code', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'boom' },
    });

    expect(await registerWithPassword(client, registration)).toEqual({
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

      const text = JSON.stringify(
        await registerWithPassword(client, registration),
      );

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
});

describe('requestRecoveryEmail', () => {
  const recovery = {
    email: 'ada@example.com',
    resetRedirect:
      'https://app.test/auth/callback?next=%2Fauth%2Fupdate-password&flow=reset',
  };

  it('asks for the reset email with the reset redirect', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });

    await requestRecoveryEmail(client, recovery);

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      'ada@example.com',
      { redirectTo: recovery.resetRedirect },
    );
  });

  it('accepts on success', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });

    expect(await requestRecoveryEmail(client, recovery)).toEqual({
      kind: 'accepted',
    });
  });

  it.each(['over_email_send_rate_limit', 'over_request_rate_limit'])(
    'reports the %s limit, and only its code',
    async (code) => {
      mocks.resetPasswordForEmail.mockResolvedValue({
        error: { code, message: 'secret provider text', status: 429 },
      });

      const outcome = await requestRecoveryEmail(client, recovery);

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

      expect(await requestRecoveryEmail(client, recovery)).toEqual({
        kind: 'accepted',
      });
    },
  );
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

    const outcome = await changeEmail(client, input);

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

    expect(await changeEmail(client, input)).toEqual({ kind: 'requested' });
  });

  it('reports the address as changed when the project applies it at once, with nothing pending', async () => {
    mocks.getUser.mockResolvedValue(user());
    mocks.updateUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'Grace@Example.com' } },
      error: null,
    });

    expect(await changeEmail(client, input)).toEqual({ kind: 'changed' });
  });

  it('does not call it changed when the address on the account is still the old one', async () => {
    mocks.getUser.mockResolvedValue(user());
    mocks.updateUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'ada@example.com' } },
      error: null,
    });

    expect(await changeEmail(client, input)).toEqual({ kind: 'requested' });
  });

  it("compares with the provider's current address, ignoring case", async () => {
    mocks.getUser.mockResolvedValue(user());

    expect(
      await changeEmail(client, { ...input, newEmail: 'ADA@Example.com' }),
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
    expect(await changeEmail(client, input)).toEqual({ kind: 'signed-out' });

    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(await changeEmail(client, input)).toEqual({ kind: 'unavailable' });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('reduces a provider error to its code, with no SDK object in the outcome', async () => {
    mocks.getUser.mockResolvedValue(user());
    mocks.updateUser.mockResolvedValue({
      data: {},
      error: { code: 'email_exists', message: 'sentinel-message', status: 422 },
    });

    const outcome = await changeEmail(client, input);

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

    const outcome = await resendEmailChange(client, { redirectTo });

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

    expect(await resendEmailChange(client, { redirectTo })).toEqual({
      kind: 'nothing-pending',
    });
    expect(mocks.resend).not.toHaveBeenCalled();
  });

  it('tells a missing session from an unreachable service', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });
    expect(await resendEmailChange(client, { redirectTo })).toEqual({
      kind: 'signed-out',
    });

    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(await resendEmailChange(client, { redirectTo })).toEqual({
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

    const outcome = await resendEmailChange(client, { redirectTo });

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
      error: { code: 'session_not_found' },
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
      error: {
        code: 'manual_linking_disabled',
        message: 'sentinel',
        status: 422,
      },
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
      error: { code, message: 'sentinel' },
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
