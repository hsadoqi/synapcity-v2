import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resend: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
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
vi.mock('@/lib/auth/origin/origin', () => ({
  getOrigin: () => 'https://app.test',
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      resend: mocks.resend,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      updateUser: mocks.updateUser,
      signInWithOAuth: mocks.signInWithOAuth,
      signOut: mocks.signOut,
    },
  }),
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

    expect(await redirectOf(signOut())).toBe('/');
    expect(mocks.signOut).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});
