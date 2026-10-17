import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));

import { registerWithPassword, requestRecoveryEmail } from './operations';

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
