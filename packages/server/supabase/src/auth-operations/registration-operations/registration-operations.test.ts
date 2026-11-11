import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerWithPassword } from './registration-operations';

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

const PASSWORD = 'sentinel-password-9f3a';
const ACCESS_TOKEN = 'sentinel-access-token';
const REFRESH_TOKEN = 'sentinel-refresh-token';

const registration = {
  email: 'ada@example.com',
  password: PASSWORD,
  firstName: 'Ada',
  lastName: 'Lovelace',
  confirmationRedirect: 'https://app.test/auth/callback?next=&flow=confirm',
};

/** What the SDK would hand back when a session exists. */
const sdkUser = {
  id: 'user-1',
  email: 'ada@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: { first_name: 'Ada', last_name: 'Lovelace' },
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
  it('sends the confirmation redirect and the names as first_name and last_name', async () => {
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
        data: { first_name: 'Ada', last_name: 'Lovelace' },
      },
    });
  });

  it('leaves out last_name when none was given, and never sends full_name or display_name', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: sdkUser, session: null },
      error: null,
    });
    const { lastName: _, ...withoutLastName } = registration;

    await registerWithPassword(client, withoutLastName);

    const metadata = mocks.signUp.mock.calls[0]?.[0].options.data;
    expect(metadata).toEqual({ first_name: 'Ada' });
    expect(metadata).not.toHaveProperty('full_name');
    expect(metadata).not.toHaveProperty('display_name');
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
