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

import {
  changeEmail,
  deleteOwnAccount,
  disconnectAccount,
  registerWithPassword,
  requestRecoveryEmail,
  resendEmailChange,
  sendAccountDeletionLink,
  sendOwnPasswordReset,
  startAccountLink,
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

    const outcome = await startAccountLink(input);

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
    expect(await startAccountLink(input)).toEqual({ kind: 'signed-out' });

    mocks.linkIdentity.mockResolvedValue({
      data: { provider: 'github', url: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(await startAccountLink(input)).toEqual({ kind: 'unavailable' });
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

    const outcome = await startAccountLink(input);

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

    expect(await startAccountLink(input)).toEqual({
      kind: 'provider-error',
      code: undefined,
    });
  });
});

describe('sendAccountDeletionLink', () => {
  const redirectTo =
    'https://app.test/auth/callback?next=%2Fauth%2Fdelete-account&flow=delete-account';
  const signedIn = (email: string | null = 'ada@example.com') =>
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: email ?? undefined } },
      error: null,
    });

  it("sends the link to the provider's address, never to what was typed, and never creates an account", async () => {
    signedIn();
    mocks.signInWithOtp.mockResolvedValue({ data: {}, error: null });

    const outcome = await sendAccountDeletionLink({
      typedEmail: ' ADA@example.com ',
      redirectTo,
    });

    expect(mocks.signInWithOtp).toHaveBeenCalledExactlyOnceWith({
      email: 'ada@example.com',
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    });
    expect(outcome).toEqual({ kind: 'sent', email: 'ada@example.com' });
  });

  it('sends nothing when the typed address is not the account address', async () => {
    signedIn();

    const outcome = await sendAccountDeletionLink({
      typedEmail: 'someone@else.test',
      redirectTo,
    });

    expect(outcome).toEqual({ kind: 'wrong-email' });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('says so when the account has no address', async () => {
    signedIn(null);

    expect(
      await sendAccountDeletionLink({ typedEmail: 'a@b.test', redirectTo }),
    ).toEqual({ kind: 'no-email' });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('tells a missing session from an outage', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });
    expect(
      await sendAccountDeletionLink({ typedEmail: 'a@b.test', redirectTo }),
    ).toEqual({ kind: 'signed-out' });

    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(
      await sendAccountDeletionLink({ typedEmail: 'a@b.test', redirectTo }),
    ).toEqual({ kind: 'unavailable' });
  });

  it('reports a rate limit and any other failure by code only', async () => {
    signedIn();
    mocks.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: { code: 'over_email_send_rate_limit', message: 'sentinel' },
    });
    expect(
      await sendAccountDeletionLink({
        typedEmail: 'ada@example.com',
        redirectTo,
      }),
    ).toEqual({ kind: 'rate-limited', code: 'over_email_send_rate_limit' });

    mocks.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: { code: 'unexpected_failure', message: 'sentinel' },
    });
    const outcome = await sendAccountDeletionLink({
      typedEmail: 'ada@example.com',
      redirectTo,
    });
    expect(outcome).toEqual({
      kind: 'provider-error',
      code: 'unexpected_failure',
    });
    expect(JSON.stringify(outcome)).not.toContain('sentinel');
  });
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

    const outcome = await disconnectAccount({ provider: 'github' });

    expect(mocks.unlinkIdentity).toHaveBeenCalledExactlyOnceWith(github);
    expect(outcome).toEqual({ kind: 'disconnected' });
  });

  it('can disconnect one of two connected accounts with no password', async () => {
    has(google, github);

    expect(await disconnectAccount({ provider: 'google' })).toEqual({
      kind: 'disconnected',
    });
    expect(mocks.unlinkIdentity).toHaveBeenCalledExactlyOnceWith(google);
  });

  it('refuses to remove the only way to sign in, and changes nothing', async () => {
    has(github);

    expect(await disconnectAccount({ provider: 'github' })).toEqual({
      kind: 'last-sign-in',
    });
    expect(mocks.unlinkIdentity).not.toHaveBeenCalled();
  });

  it('says so when it is not connected, and changes nothing', async () => {
    has(email, github);

    expect(await disconnectAccount({ provider: 'google' })).toEqual({
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

    const outcome = await disconnectAccount({ provider: 'github' });

    expect(outcome).toEqual(expected);
    expect(JSON.stringify(outcome)).not.toContain('sentinel');
  });

  it('tells a missing session from an outage when listing', async () => {
    mocks.getUserIdentities.mockResolvedValue({
      data: null,
      error: new AuthSessionMissingError(),
    });
    expect(await disconnectAccount({ provider: 'github' })).toEqual({
      kind: 'signed-out',
    });

    mocks.getUserIdentities.mockResolvedValue({
      data: null,
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(await disconnectAccount({ provider: 'github' })).toEqual({
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

    expect(await disconnectAccount({ provider: 'github' })).toEqual({
      kind: 'unavailable',
    });
  });
});
