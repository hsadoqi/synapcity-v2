import { AuthApiError } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resendSignupConfirmation, updateOwnPassword } from './auth-operations';
import {
  exchangeAuthCode,
  signInWithPassword,
  signOutSession,
  startOAuthSignIn,
} from './sign-in-operations';

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  signOut: vi.fn(),
  resend: vi.fn(),
  updateUser: vi.fn(),
}));

const client = { auth: mocks } as never;
const SECRET = 'sentinel-secret-7c1e';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signInWithPassword', () => {
  it('signs in and reports the user id only', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'a@b.co' },
        session: { access_token: SECRET },
      },
      error: null,
    });

    const outcome = await signInWithPassword(client, {
      email: 'a@b.co',
      password: SECRET,
    });

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.co',
      password: SECRET,
    });
    expect(outcome).toStrictEqual({ kind: 'signed-in', userId: 'u1' });
  });

  it('reports a refusal by its code only', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError(SECRET, 400, 'email_not_confirmed'),
    });

    const outcome = await signInWithPassword(client, {
      email: 'a@b.co',
      password: 'x',
    });

    expect(outcome).toStrictEqual({
      kind: 'refused',
      code: 'email_not_confirmed',
    });
  });
});

describe('startOAuthSignIn', () => {
  const input = {
    provider: 'github' as const,
    redirectTo: 'https://app.test/auth/callback?next=&flow=oauth',
  };

  it('returns the provider URL to send the browser to', async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://github.test/authorize' },
      error: null,
    });

    expect(await startOAuthSignIn(client, input)).toStrictEqual({
      kind: 'redirect',
      url: 'https://github.test/authorize',
    });
    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'github',
      options: { redirectTo: input.redirectTo },
    });
  });

  it('fails without a URL or with an error', async () => {
    mocks.signInWithOAuth.mockResolvedValueOnce({
      data: { url: null },
      error: null,
    });
    expect(await startOAuthSignIn(client, input)).toStrictEqual({
      kind: 'provider-error',
      failure: {},
    });

    mocks.signInWithOAuth.mockResolvedValueOnce({
      data: { url: null },
      error: new AuthApiError(SECRET, 400, 'provider_disabled'),
    });
    expect(await startOAuthSignIn(client, input)).toStrictEqual({
      kind: 'provider-error',
      failure: { code: 'provider_disabled', status: 400 },
    });
  });
});

describe('exchangeAuthCode', () => {
  it('signs in and says whether a new account still needs its profile step', async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: {
        user: {
          id: 'u1',
          created_at: new Date().toISOString(),
          user_metadata: {},
        },
        session: { access_token: SECRET },
      },
      error: null,
    });

    const outcome = await exchangeAuthCode(client, 'code-1');

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith('code-1');
    expect(outcome).toStrictEqual({
      kind: 'signed-in',
      userId: 'u1',
      needsProfileSetup: true,
    });
  });

  it('does not ask an older account for its profile', async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: {
        user: {
          id: 'u1',
          created_at: '2020-01-01T00:00:00Z',
          user_metadata: {},
        },
        session: {},
      },
      error: null,
    });

    expect(await exchangeAuthCode(client, 'code-1')).toMatchObject({
      needsProfileSetup: false,
    });
  });

  it('fails by code and status only', async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError(SECRET, 400, 'flow_state_not_found'),
    });

    const outcome = await exchangeAuthCode(client, 'code-1');

    expect(outcome).toStrictEqual({
      kind: 'failed',
      failure: { code: 'flow_state_not_found', status: 400 },
    });
  });
});

describe('signOutSession', () => {
  it('signs out with the scope it is given', async () => {
    mocks.signOut.mockResolvedValue({ error: null });

    expect(await signOutSession(client, { scope: 'local' })).toStrictEqual({
      kind: 'signed-out',
    });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('reports a returned error by code and status', async () => {
    mocks.signOut.mockResolvedValue({
      error: new AuthApiError(SECRET, 500, 'unexpected_failure'),
    });

    expect(await signOutSession(client, { scope: 'local' })).toStrictEqual({
      kind: 'failed',
      failure: { code: 'unexpected_failure', status: 500 },
    });
  });

  it('never throws', async () => {
    mocks.signOut.mockRejectedValue(new Error(SECRET));

    expect(await signOutSession(client, { scope: 'local' })).toStrictEqual({
      kind: 'failed',
      failure: {},
      thrown: true,
    });
  });
});

describe('resendSignupConfirmation', () => {
  const input = {
    email: 'a@b.co',
    confirmationRedirect: 'https://app.test/auth/callback?next=&flow=confirm',
  };

  it('asks for the sign-up email again with the confirmation redirect', async () => {
    mocks.resend.mockResolvedValue({ error: null });

    expect(await resendSignupConfirmation(client, input)).toEqual({
      kind: 'accepted',
    });
    expect(mocks.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'a@b.co',
      options: { emailRedirectTo: input.confirmationRedirect },
    });
  });

  it('reports a rate limit by its code', async () => {
    mocks.resend.mockResolvedValue({
      error: { code: 'over_email_send_rate_limit', message: SECRET },
    });

    expect(await resendSignupConfirmation(client, input)).toStrictEqual({
      kind: 'rate-limited',
      code: 'over_email_send_rate_limit',
    });
  });

  it('answers the same as success for any other error', async () => {
    mocks.resend.mockResolvedValue({ error: { code: 'user_not_found' } });

    expect(await resendSignupConfirmation(client, input)).toEqual({
      kind: 'accepted',
    });
  });
});

describe('updateOwnPassword', () => {
  it('updates the password and reports the user id', async () => {
    mocks.updateUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    });

    expect(await updateOwnPassword(client, { password: SECRET })).toStrictEqual(
      {
        kind: 'updated',
        userId: 'u1',
      },
    );
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: SECRET });
  });

  it('reports a failure by code and status only', async () => {
    mocks.updateUser.mockResolvedValue({
      data: { user: null },
      error: new AuthApiError(SECRET, 422, 'same_password'),
    });

    const outcome = await updateOwnPassword(client, { password: 'x' });

    expect(outcome).toStrictEqual({
      kind: 'provider-error',
      failure: { code: 'same_password', status: 422 },
    });
    expect(JSON.stringify(outcome)).not.toContain(SECRET);
  });
});
