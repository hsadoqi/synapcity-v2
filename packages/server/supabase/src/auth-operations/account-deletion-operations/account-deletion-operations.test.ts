import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from '@supabase/supabase-js';

import { sendAccountDeletionLink } from './account-deletion-operations';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signInWithOtp: vi.fn(),
}));

const client = {
  auth: { getUser: mocks.getUser, signInWithOtp: mocks.signInWithOtp },
} as never;

beforeEach(() => {
  vi.clearAllMocks();
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

    const outcome = await sendAccountDeletionLink(client, {
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

    const outcome = await sendAccountDeletionLink(client, {
      typedEmail: 'someone@else.test',
      redirectTo,
    });

    expect(outcome).toEqual({ kind: 'wrong-email' });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('says so when the account has no address', async () => {
    signedIn(null);

    expect(
      await sendAccountDeletionLink(client, {
        typedEmail: 'a@b.test',
        redirectTo,
      }),
    ).toEqual({ kind: 'no-email' });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('tells a missing session from an outage', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });
    expect(
      await sendAccountDeletionLink(client, {
        typedEmail: 'a@b.test',
        redirectTo,
      }),
    ).toEqual({ kind: 'signed-out' });

    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
    expect(
      await sendAccountDeletionLink(client, {
        typedEmail: 'a@b.test',
        redirectTo,
      }),
    ).toEqual({ kind: 'unavailable' });
  });

  it('reports a rate limit and any other failure by code only', async () => {
    signedIn();
    mocks.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: { code: 'over_email_send_rate_limit', message: 'sentinel' },
    });
    expect(
      await sendAccountDeletionLink(client, {
        typedEmail: 'ada@example.com',
        redirectTo,
      }),
    ).toEqual({ kind: 'rate-limited', code: 'over_email_send_rate_limit' });

    mocks.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: { code: 'unexpected_failure', message: 'sentinel' },
    });
    const outcome = await sendAccountDeletionLink(client, {
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
