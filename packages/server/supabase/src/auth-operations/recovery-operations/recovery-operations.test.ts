import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changeEmail, resendEmailChange } from '../password-operations';
import {
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from '@supabase/supabase-js';
import { requestRecoveryEmail } from './recovery-operations';

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
      // What auth-js returns for a `session_not_found` answer.
      error: new AuthSessionMissingError(),
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
      // What auth-js returns for a `session_not_found` answer.
      error: new AuthSessionMissingError(),
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
