import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resend: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  createClient: vi.fn(),
}));

/** Stands in for Next's `redirect`, which never returns. */
class Redirected extends Error {
  constructor(readonly url: string) {
    super(`redirect:${url}`);
  }
}

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Redirected(url);
  },
}));
vi.mock('@/features/auth/server/site-origin', () => ({
  getOrigin: () => 'https://app.test',
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    mocks.createClient();
    return {
      auth: {
        signInWithPassword: mocks.signInWithPassword,
        signUp: mocks.signUp,
        resend: mocks.resend,
        resetPasswordForEmail: mocks.resetPasswordForEmail,
        updateUser: mocks.updateUser,
        signInWithOAuth: mocks.signInWithOAuth,
        signOut: mocks.signOut,
      },
    };
  },
}));

import {
  requestPasswordReset,
  resendConfirmation,
  signInWithOAuth,
  signInWithPassword,
  signOut,
  signUp,
  updatePassword,
} from './actions';

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

/** The URL an action redirected to, or `null` when it returned normally. */
async function redirectOf(run: Promise<unknown>): Promise<string | null> {
  try {
    await run;
    return null;
  } catch (error) {
    if (error instanceof Redirected) return error.url;
    throw error;
  }
}

const USER_ID = 'user-1';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signInWithPassword', () => {
  it('names the empty fields without calling Supabase', async () => {
    const state = await signInWithPassword(
      {},
      form({ email: '', password: '' }),
    );

    expect(state.fields).toEqual(['email', 'password']);
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it('echoes the email but never the password on a refusal', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: {},
      error: { code: 'invalid_credentials' },
    });

    const state = await signInWithPassword(
      {},
      form({ email: ' a@b.co ', password: 'hunter2hunter2' }),
    );

    expect(state.error).toBe('Email or password is incorrect.');
    expect(state.fields).toEqual(['email', 'password']);
    expect(state.unconfirmed).toBe(false);
    expect(state.data?.user?.email).toBe('a@b.co');
    expect(JSON.stringify(state)).not.toContain('hunter2');
  });

  it('flags an unconfirmed address so the form can offer a new link', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: {},
      error: { code: 'email_not_confirmed' },
    });

    const state = await signInWithPassword(
      {},
      form({ email: 'a@b.co', password: 'x'.repeat(12) }),
    );

    expect(state.unconfirmed).toBe(true);
  });

  it('goes to a safe `next` after signing in', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });

    const url = await redirectOf(
      signInWithPassword(
        {},
        form({ email: 'a@b.co', password: 'x'.repeat(12), next: '/a/b?c=1' }),
      ),
    );

    expect(url).toBe('/a/b?c=1');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it.each(['//evil.example', 'https://evil.example', '/\\evil.example'])(
    'falls back to the user home for the unsafe `next` %j',
    async (next) => {
      mocks.signInWithPassword.mockResolvedValue({
        data: { user: { id: USER_ID } },
        error: null,
      });

      const url = await redirectOf(
        signInWithPassword(
          {},
          form({ email: 'a@b.co', password: 'x'.repeat(12), next }),
        ),
      );

      expect(url).toBe(`/${USER_ID}/home`);
    },
  );
});

describe('signUp', () => {
  const valid = {
    email: 'a@b.co',
    name: 'Ada',
    password: 'x'.repeat(12),
  };

  it('checks email, then name, then password, without calling Supabase', async () => {
    expect((await signUp({}, form({ ...valid, email: '' }))).fields).toEqual([
      'email',
    ]);
    expect((await signUp({}, form({ ...valid, name: ' ' }))).fields).toEqual([
      'name',
    ]);
    expect(
      (await signUp({}, form({ ...valid, password: 'short' }))).fields,
    ).toEqual(['password']);
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it('asks for confirmation without promising a link was sent', async () => {
    mocks.signUp.mockResolvedValue({
      data: { session: null, user: { id: USER_ID } },
      error: null,
    });

    const state = await signUp({}, form({ ...valid, next: '/x' }));

    expect(state.success).toBe(true);
    expect(state.message).not.toMatch(/was sent|we sent/i);
    expect(state.data?.user).toEqual({ email: 'a@b.co', name: 'Ada' });
    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo:
            'https://app.test/auth/callback?next=%2Fx&flow=confirm',
          data: { full_name: 'Ada' },
        }),
      }),
    );
  });

  it('signs straight in when the project hands back a session', async () => {
    mocks.signUp.mockResolvedValue({
      data: { session: {}, user: { id: USER_ID } },
      error: null,
    });

    expect(await redirectOf(signUp({}, form(valid)))).toBe(`/${USER_ID}/home`);
  });
});

describe('resendConfirmation', () => {
  it('reports a rate limit', async () => {
    mocks.resend.mockResolvedValue({
      error: { code: 'over_email_send_rate_limit' },
    });

    const state = await resendConfirmation({}, form({ email: 'a@b.co' }));

    expect(state.error).toBe(
      'Too many attempts. Wait a few minutes and try again.',
    );
    expect(state.success).toBeUndefined();
  });

  it('answers the same whether or not the address is known', async () => {
    mocks.resend.mockResolvedValue({ error: { code: 'user_not_found' } });
    const unknown = await resendConfirmation({}, form({ email: 'a@b.co' }));

    mocks.resend.mockResolvedValue({ error: null });
    const known = await resendConfirmation({}, form({ email: 'a@b.co' }));

    expect(unknown).toEqual(known);
    expect(known.success).toBe(true);
  });
});

describe('requestPasswordReset', () => {
  it.each(['over_email_send_rate_limit', 'over_request_rate_limit'])(
    'reports the %s limit instead of claiming a link is on its way',
    async (code) => {
      mocks.resetPasswordForEmail.mockResolvedValue({ error: { code } });

      const state = await requestPasswordReset({}, form({ email: 'a@b.co' }));

      expect(state.error).toBe(
        'Too many attempts. Wait a few minutes and try again.',
      );
      expect(state.success).toBeUndefined();
    },
  );

  it('answers the same whether or not the address has an account', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({
      error: { code: 'user_not_found' },
    });
    const unknown = await requestPasswordReset({}, form({ email: 'a@b.co' }));

    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    const known = await requestPasswordReset({}, form({ email: 'a@b.co' }));

    expect(unknown).toEqual(known);
    expect(known.success).toBe(true);
  });

  it('sends the link back through the callback with the reset flow', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });

    await requestPasswordReset({}, form({ email: 'a@b.co' }));

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('a@b.co', {
      redirectTo:
        'https://app.test/auth/callback?next=%2Fauth%2Fupdate-password&flow=reset',
    });
  });
});

describe('updatePassword', () => {
  it('rejects a short password before calling Supabase', async () => {
    const state = await updatePassword(
      {},
      form({ password: 'short', confirm: 'short' }),
    );

    expect(state.fields).toEqual(['password']);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('rejects a mismatched confirmation', async () => {
    const state = await updatePassword(
      {},
      form({ password: 'x'.repeat(12), confirm: 'y'.repeat(12) }),
    );

    expect(state.fields).toEqual(['confirm']);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('goes to the user home after changing it', async () => {
    mocks.updateUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });

    const url = await redirectOf(
      updatePassword(
        {},
        form({ password: 'x'.repeat(12), confirm: 'x'.repeat(12) }),
      ),
    );

    expect(url).toBe(`/${USER_ID}/home`);
  });
});

describe('signInWithOAuth', () => {
  it('refuses a provider that is not on the list', async () => {
    const url = await redirectOf(signInWithOAuth(form({ provider: 'evil' })));

    expect(url).toBe('/auth/error?reason=oauth');
    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
  });

  it('hands off to the provider with a callback tagged oauth', async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://provider.test/authorize' },
      error: null,
    });

    const url = await redirectOf(
      signInWithOAuth(form({ provider: 'github', next: '/x' })),
    );

    expect(url).toBe('https://provider.test/authorize');
    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'github',
      options: {
        redirectTo: 'https://app.test/auth/callback?next=%2Fx&flow=oauth',
      },
    });
  });

  it('sends a failed hand-off to the error page', async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: { code: 'x' },
    });

    expect(
      await redirectOf(signInWithOAuth(form({ provider: 'google' }))),
    ).toBe('/auth/error?reason=oauth');
  });
});

describe('signOut', () => {
  it('signs out, refreshes the layout and goes to the landing page', async () => {
    mocks.signOut.mockResolvedValue({});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await redirectOf(signOut())).toBe('/');
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(warn).not.toHaveBeenCalled();
  });

  describe('when the provider fails', () => {
    const LEAK_MARKER = 'sentinel-marker-9f3a';
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warn.mockRestore();
    });

    /** Everything the action logged, as one string. */
    function logged(): string {
      return JSON.stringify(warn.mock.calls);
    }

    it('still revalidates and redirects, and logs only the code', async () => {
      mocks.signOut.mockResolvedValue({
        error: {
          code: 'session_not_found',
          status: 403,
          message: LEAK_MARKER,
          email: `${LEAK_MARKER}@b.co`,
        },
      });

      expect(await redirectOf(signOut())).toBe('/');
      expect(mocks.signOut).toHaveBeenCalledOnce();
      expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
      expect(warn).toHaveBeenCalledExactlyOnceWith('signOut failed', {
        code: 'session_not_found',
        status: 403,
      });
      expect(logged()).not.toContain(LEAK_MARKER);
    });

    it('still revalidates and redirects when the SDK throws', async () => {
      mocks.signOut.mockRejectedValue(new Error(LEAK_MARKER));

      expect(await redirectOf(signOut())).toBe('/');
      expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
      expect(warn).toHaveBeenCalledExactlyOnceWith('signOut failed', {
        thrown: true,
      });
      expect(logged()).not.toContain(LEAK_MARKER);
    });
  });
});

describe('results never echo a password', () => {
  const PASSWORD = 'sentinel-password-5c1d';
  const valid = { email: 'a@b.co', name: 'Ada', password: PASSWORD };

  it('after a refused sign-in', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: {},
      error: { code: 'invalid_credentials' },
    });

    const state = await signInWithPassword({}, form(valid));

    expect(state.error).toBeDefined();
    expect(JSON.stringify(state)).not.toContain(PASSWORD);
  });

  it('after a validation failure and a provider failure at sign-up', async () => {
    const invalid = await signUp({}, form({ ...valid, name: ' ' }));
    expect(invalid.error).toBeDefined();
    expect(JSON.stringify(invalid)).not.toContain(PASSWORD);

    mocks.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'weak_password', message: PASSWORD },
    });
    const refused = await signUp({}, form(valid));
    expect(refused.error).toBeDefined();
    expect(JSON.stringify(refused)).not.toContain(PASSWORD);
  });

  it('after a successful sign-up that asks for confirmation', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: { id: USER_ID }, session: null },
      error: null,
    });

    const state = await signUp({}, form(valid));

    expect(state.success).toBe(true);
    expect(JSON.stringify(state)).not.toContain(PASSWORD);
  });

  it('after a mismatched or refused password change', async () => {
    const mismatch = await updatePassword(
      {},
      form({ password: PASSWORD, confirm: 'different-password' }),
    );
    expect(JSON.stringify(mismatch)).not.toContain(PASSWORD);

    mocks.updateUser.mockResolvedValue({
      data: {},
      error: { code: 'same_password' },
    });
    const refused = await updatePassword(
      {},
      form({ password: PASSWORD, confirm: PASSWORD }),
    );
    expect(refused.error).toBeDefined();
    expect(JSON.stringify(refused)).not.toContain(PASSWORD);
  });
});

describe('invalid submissions never reach the provider', () => {
  it.each([
    ['resendConfirmation', () => resendConfirmation({}, form({ email: ' ' }))],
    [
      'requestPasswordReset',
      () => requestPasswordReset({}, form({ email: '' })),
    ],
  ])('%s with no email', async (_, run) => {
    const state = await run();

    expect(state.fields).toEqual(['email']);
    expect(mocks.resend).not.toHaveBeenCalled();
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });
});

describe('development fixture mode', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
    mocks.createClient.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  const valid = form({
    email: 'a@b.test',
    password: 'long-enough-password',
    confirm: 'long-enough-password',
    name: 'Ada',
    provider: 'google',
  });

  it('rejects every form action before a Supabase client is built', async () => {
    const results = await Promise.all([
      signInWithPassword({}, valid),
      signUp({}, valid),
      resendConfirmation({}, valid),
      requestPasswordReset({}, valid),
      updatePassword({}, valid),
    ]);

    for (const result of results) {
      expect(result.error).toContain('Fixture mode');
    }
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('sends OAuth to the error page and sign-out home without a client', async () => {
    expect(await redirectOf(signInWithOAuth(valid))).toContain('/auth/error');
    expect(await redirectOf(signOut())).toBe('/');
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('does not apply in production even with the flag set', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mocks.signInWithPassword.mockResolvedValue({
      data: null,
      error: { code: 'invalid_credentials' },
    });

    await signInWithPassword({}, valid);

    expect(mocks.createClient).toHaveBeenCalled();
  });
});
