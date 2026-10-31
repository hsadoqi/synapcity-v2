import {
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from '@supabase/supabase-js';
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
  getClaims: vi.fn(),
  getUser: vi.fn(),
  linkIdentity: vi.fn(),
  signInWithOtp: vi.fn(),
  getUserIdentities: vi.fn(),
  unlinkIdentity: vi.fn(),
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
        getClaims: mocks.getClaims,
        getUser: mocks.getUser,
        linkIdentity: mocks.linkIdentity,
        signInWithOtp: mocks.signInWithOtp,
        getUserIdentities: mocks.getUserIdentities,
        unlinkIdentity: mocks.unlinkIdentity,
      },
    };
  },
}));

import {
  connectAccount,
  disconnectAccount,
  requestAccountDeletion,
  requestEmailChange,
  requestOwnPasswordReset,
  requestPasswordReset,
  resendConfirmation,
  resendEmailChange,
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
/** Meets the whole password rule: length, lowercase, uppercase, digit, symbol. */
const STRONG = 'Str0ng-Passw0rd!';

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
      form({ email: ' a@b.co ', password: STRONG }),
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
      form({ email: 'a@b.co', password: STRONG }),
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
        form({ email: 'a@b.co', password: STRONG, next: '/a/b?c=1' }),
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
          form({ email: 'a@b.co', password: STRONG, next }),
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
    password: STRONG,
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
      form({ password: STRONG, confirm: `${STRONG}x` }),
    );

    expect(state.fields).toEqual(['confirm']);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('goes back to where the reset was started from, carrying the notice', async () => {
    mocks.updateUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });

    const url = await redirectOf(
      updatePassword(
        {},
        form({
          password: STRONG,
          confirm: STRONG,
          next: `/${USER_ID}/settings`,
        }),
      ),
    );

    expect(url).toBe(`/${USER_ID}/settings?notice=password-updated`);
  });

  it.each([
    ['an external URL', 'https://evil.test/steal'],
    ['a protocol-relative URL', '//evil.test/steal'],
    ['a script URL', 'javascript:alert(1)'],
  ])('ignores %s as the place to go back to', async (_label, next) => {
    mocks.updateUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });

    const url = await redirectOf(
      updatePassword({}, form({ password: STRONG, confirm: STRONG, next })),
    );

    expect(url).toBe(`/${USER_ID}/home?notice=password-updated`);
  });

  it('goes to the user home after changing it, carrying the notice', async () => {
    mocks.updateUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });

    const url = await redirectOf(
      updatePassword({}, form({ password: STRONG, confirm: STRONG })),
    );

    expect(url).toBe(`/${USER_ID}/home?notice=password-updated`);
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

  it('signs out of this browser only, leaving other devices signed in', async () => {
    mocks.signOut.mockResolvedValue({});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await redirectOf(signOut());

    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
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
  const PASSWORD = 'Sentinel-Passw0rd-5c1d!';
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

describe('changing the email', () => {
  const CURRENT = 'ada@example.com';
  const NEW = 'grace@example.com';
  const REDIRECT =
    'https://app.test/auth/callback?next=%2Fuser-1%2Fsettings&flow=email-change';
  const SIGNED_OUT =
    'For your security, sign out, sign in again, then try once more.';

  /** Who is signed in: the token's claims and the provider's record agree. */
  function signedIn(user: { email?: string; new_email?: string } = {}) {
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: USER_ID, email: CURRENT } },
      error: null,
    });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: CURRENT, ...user } },
      error: null,
    });
  }
  function signedOut() {
    mocks.getClaims.mockResolvedValue({ data: null, error: null });
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });
  }

  beforeEach(() => {
    signedIn();
    mocks.updateUser.mockResolvedValue({ data: {}, error: null });
    mocks.resend.mockResolvedValue({ data: {}, error: null });
  });

  describe('requestEmailChange', () => {
    it('asks for an address before calling the provider', async () => {
      const state = await requestEmailChange({}, form({ email: '   ' }));

      expect(state).toMatchObject({
        error: 'Enter your email.',
        fields: ['email'],
      });
      expect(mocks.updateUser).not.toHaveBeenCalled();
    });

    it('needs a session', async () => {
      signedOut();

      const state = await requestEmailChange({}, form({ email: NEW }));

      expect(state.error).toBe(SIGNED_OUT);
      expect(state.success).toBeUndefined();
      expect(mocks.updateUser).not.toHaveBeenCalled();
    });

    it('does not mistake an outage for a signed-out session', async () => {
      mocks.getUser.mockResolvedValue({
        data: { user: null },
        error: new AuthRetryableFetchError('fetch failed', 0),
      });

      const state = await requestEmailChange({}, form({ email: NEW }));

      expect(state.error).toBe('Something went wrong. Try again.');
      expect(state.error).not.toBe(SIGNED_OUT);
    });

    it.each([CURRENT, CURRENT.toUpperCase(), `  ${CURRENT} `])(
      'refuses the address they already have (%s)',
      async (typed) => {
        const state = await requestEmailChange({}, form({ email: typed }));

        expect(state.error).toBe('That is already your email address.');
        expect(state.fields).toEqual(['email']);
        expect(mocks.updateUser).not.toHaveBeenCalledWith(
          expect.objectContaining({ email: expect.anything() }),
          expect.anything(),
        );
      },
    );

    it('asks the provider for a confirmation, returning to their settings, and changes nothing now', async () => {
      const state = await requestEmailChange({}, form({ email: ` ${NEW} ` }));

      expect(mocks.updateUser).toHaveBeenCalledExactlyOnceWith(
        { email: NEW },
        { emailRedirectTo: REDIRECT },
      );
      expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
      expect(state.success).toBe(true);
      expect(state.message).toContain(NEW);
      expect(state.message).toContain('stays the same until you use it');
      expect(state.error).toBeUndefined();
    });

    it('says the address was updated, and sent no link, when the project applies it at once', async () => {
      mocks.updateUser.mockResolvedValue({
        data: { user: { id: USER_ID, email: NEW } },
        error: null,
      });

      const state = await requestEmailChange({}, form({ email: NEW }));

      expect(state.success).toBe(true);
      expect(state.message).toBe('Email address updated.');
      expect(state.message).not.toMatch(/link/i);
      expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('words the success so it is true whether or not the current address must confirm too', async () => {
      const state = await requestEmailChange({}, form({ email: NEW }));

      expect(state.message).toMatch(/may get one at your current address/i);
      expect(state.message).not.toMatch(/both|must/i);
    });

    it('says an address cannot be used without saying why', async () => {
      mocks.updateUser.mockResolvedValue({
        data: {},
        error: {
          code: 'email_exists',
          message: 'A user with this email already exists',
        },
      });

      const state = await requestEmailChange({}, form({ email: NEW }));

      expect(state.error).toBe(
        'That address cannot be used. Try a different one.',
      );
      expect(state.fields).toEqual(['email']);
      expect(state.error).not.toMatch(/already|exists|account|registered/i);
      expect(state.data?.user?.email).toBe(NEW);
    });

    it('shows a rate limit as the request-wide problem it is', async () => {
      mocks.updateUser.mockResolvedValue({
        data: {},
        error: { code: 'over_email_send_rate_limit' },
      });

      const state = await requestEmailChange({}, form({ email: NEW }));

      expect(state.error).toBe(
        'Too many attempts. Wait a few minutes and try again.',
      );
      expect(state.fields).toEqual([]);
    });

    it('logs a failure by code only, never the message or the address', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mocks.updateUser.mockResolvedValue({
        data: {},
        error: {
          code: 'unexpected_failure',
          message: `could not email ${NEW}`,
        },
      });

      const state = await requestEmailChange({}, form({ email: NEW }));

      expect(state.error).toBe('Something went wrong. Try again.');
      expect(warn).toHaveBeenCalledWith('requestEmailChange failed', {
        code: 'unexpected_failure',
      });
      expect(JSON.stringify(warn.mock.calls)).not.toContain(NEW);
      warn.mockRestore();
    });

    it('echoes the typed address on a refusal so it can be corrected', async () => {
      mocks.updateUser.mockResolvedValue({
        data: {},
        error: { code: 'email_address_invalid' },
      });

      const state = await requestEmailChange(
        {},
        form({ email: 'nope@test.example' }),
      );

      expect(state.data?.user?.email).toBe('nope@test.example');
      expect(state.fields).toEqual(['email']);
    });
  });

  describe('resendEmailChange', () => {
    it('sends again to the address the provider holds as pending, never one from the form', async () => {
      signedIn({ new_email: NEW });

      const state = await resendEmailChange(
        {},
        form({ email: 'attacker@evil.test' }),
      );

      expect(mocks.resend).toHaveBeenCalledExactlyOnceWith({
        type: 'email_change',
        email: NEW,
        options: { emailRedirectTo: REDIRECT },
      });
      expect(JSON.stringify(mocks.resend.mock.calls)).not.toContain('attacker');
      expect(state.success).toBe(true);
      expect(state.message).toBe(
        'Requested again. It can take a minute to arrive.',
      );
    });

    it('has nothing to send when no change is waiting', async () => {
      signedIn();

      const state = await resendEmailChange({}, form({}));

      expect(state.error).toBe(
        'There is no email change waiting to be confirmed.',
      );
      expect(mocks.resend).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('needs a session', async () => {
      signedOut();

      const state = await resendEmailChange({}, form({}));

      expect(state.error).toBe(SIGNED_OUT);
      expect(mocks.resend).not.toHaveBeenCalled();
    });

    it('shows a rate limit', async () => {
      signedIn({ new_email: NEW });
      mocks.resend.mockResolvedValue({
        data: {},
        error: { code: 'over_email_send_rate_limit' },
      });

      const state = await resendEmailChange({}, form({}));

      expect(state.error).toBe(
        'Too many attempts. Wait a few minutes and try again.',
      );
    });

    it('logs any other failure by code only', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      signedIn({ new_email: NEW });
      mocks.resend.mockResolvedValue({
        data: {},
        error: { code: 'unexpected_failure', message: `failed for ${NEW}` },
      });

      const state = await resendEmailChange({}, form({}));

      expect(state.error).toBe('Something went wrong. Try again.');
      expect(warn).toHaveBeenCalledWith('resendEmailChange failed', {
        code: 'unexpected_failure',
      });
      expect(JSON.stringify(warn.mock.calls)).not.toContain(NEW);
      warn.mockRestore();
    });
  });
});

describe('requestOwnPasswordReset', () => {
  const OWN = 'ada@example.com';
  const SIGNED_OUT =
    'For your security, sign out, sign in again, then try once more.';
  const signedIn = (email: string | null = OWN) => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: USER_ID, email: OWN } },
      error: null,
    });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: email ?? undefined } },
      error: null,
    });
  };

  beforeEach(() => {
    signedIn();
    mocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  });

  it('sends the link to their own address, through the same reset flow as the public form', async () => {
    const state = await requestOwnPasswordReset({}, form({}));

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledExactlyOnceWith(OWN, {
      // Back to settings once the new password is chosen, not to home.
      redirectTo:
        'https://app.test/auth/callback?next=%2Fauth%2Fupdate-password%3Fnext%3D%252Fuser-1%252Fsettings&flow=reset',
    });
    expect(state.success).toBe(true);
    expect(state.message).toBe(
      `We sent a link to ${OWN}. Open it to choose a new password.`,
    );
  });

  it('ignores any address in the form', async () => {
    await requestOwnPasswordReset({}, form({ email: 'attacker@evil.test' }));

    expect(
      JSON.stringify(mocks.resetPasswordForEmail.mock.calls),
    ).not.toContain('attacker');
  });

  it('needs a session', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });

    const state = await requestOwnPasswordReset({}, form({}));

    expect(state.error).toBe(SIGNED_OUT);
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('does not call an outage a signed-out session', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });

    const state = await requestOwnPasswordReset({}, form({}));

    expect(state.error).toBe('Something went wrong. Try again.');
  });

  it('says so when the account has no email', async () => {
    signedIn(null);

    const state = await requestOwnPasswordReset({}, form({}));

    expect(state.error).toBe(
      'This account has no email address to send a link to.',
    );
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('shows a rate limit', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { code: 'over_email_send_rate_limit' },
    });

    const state = await requestOwnPasswordReset({}, form({}));

    expect(state.error).toBe(
      'Too many attempts. Wait a few minutes and try again.',
    );
    expect(state.success).toBeUndefined();
  });

  it('is honest about any other failure, and logs only its code', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { code: 'unexpected_failure', message: `failed for ${OWN}` },
    });

    const state = await requestOwnPasswordReset({}, form({}));

    expect(state.error).toBe('Something went wrong. Try again.');
    expect(state.success).toBeUndefined();
    expect(warn).toHaveBeenCalledWith('requestOwnPasswordReset failed', {
      code: 'unexpected_failure',
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain(OWN);
    warn.mockRestore();
  });
});

describe('when the session has gone, the form is told so it can link to sign-in', () => {
  const claimsGone = () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: null });
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });
  };
  /** Claims still say signed in, but the provider no longer knows the session. */
  const sessionGoneAtProvider = () => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: USER_ID, email: 'ada@example.com' } },
      error: null,
    });
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });
  };
  const outage = () => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: USER_ID, email: 'ada@example.com' } },
      error: null,
    });
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });
  };

  const actions = [
    [
      'requestEmailChange',
      () => requestEmailChange({}, form({ email: 'grace@example.com' })),
    ],
    ['resendEmailChange', () => resendEmailChange({}, form({}))],
    ['requestOwnPasswordReset', () => requestOwnPasswordReset({}, form({}))],
  ] as const;

  it.each(actions)(
    '%s flags it when the token has no claims',
    async (_name, run) => {
      claimsGone();

      const state = await run();

      expect(state.signedOut).toBe(true);
      expect(state.error).toBe(
        'For your security, sign out, sign in again, then try once more.',
      );
    },
  );

  it.each(actions)(
    '%s flags it when only the provider knows the session is gone',
    async (_name, run) => {
      sessionGoneAtProvider();

      const state = await run();

      expect(state.signedOut).toBe(true);
    },
  );

  it.each(actions)(
    '%s does not flag an outage, where signing in again would not help',
    async (_name, run) => {
      outage();

      const state = await run();

      expect(state.error).toBe('Something went wrong. Try again.');
      expect(state.signedOut).toBeUndefined();
    },
  );
});

describe('connectAccount', () => {
  const PROVIDER_URL = 'https://accounts.google.com/o/oauth2/v2/auth?x=1';
  const SIGNED_OUT =
    'For your security, sign out, sign in again, then try once more.';

  beforeEach(() => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: USER_ID, email: 'ada@example.com' } },
      error: null,
    });
    mocks.linkIdentity.mockResolvedValue({
      data: { provider: 'google', url: PROVIDER_URL },
      error: null,
    });
  });

  it('sends the browser to the provider, asking to come back to settings through the link flow', async () => {
    const url = await redirectOf(
      connectAccount({}, form({ provider: 'google' })),
    );

    expect(url).toBe(PROVIDER_URL);
    expect(mocks.linkIdentity).toHaveBeenCalledExactlyOnceWith({
      provider: 'google',
      options: {
        redirectTo:
          'https://app.test/auth/callback?next=%2Fuser-1%2Fsettings&flow=link',
      },
    });
  });

  it.each(['', 'facebook', 'Google', '<script>', 'constructor'])(
    'refuses %j as a provider, without calling the provider',
    async (provider) => {
      const state = await connectAccount({}, form({ provider }));

      expect(state.error).toBe('Something went wrong. Try again.');
      expect(mocks.linkIdentity).not.toHaveBeenCalled();
    },
  );

  it('needs a session, and flags it so the form can link to sign-in', async () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: null });

    const state = await connectAccount({}, form({ provider: 'google' }));

    expect(state.error).toBe(SIGNED_OUT);
    expect(state.signedOut).toBe(true);
    expect(mocks.linkIdentity).not.toHaveBeenCalled();
  });

  it('flags a session the provider no longer knows', async () => {
    mocks.linkIdentity.mockResolvedValue({
      data: { provider: 'google', url: null },
      error: new AuthSessionMissingError(),
    });

    const state = await connectAccount({}, form({ provider: 'google' }));

    expect(state.signedOut).toBe(true);
  });

  it('does not call an outage a signed-out session', async () => {
    mocks.linkIdentity.mockResolvedValue({
      data: { provider: 'google', url: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });

    const state = await connectAccount({}, form({ provider: 'google' }));

    expect(state.error).toBe('Something went wrong. Try again.');
    expect(state.signedOut).toBeUndefined();
  });

  it('says plainly when connecting accounts is switched off for the project', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.linkIdentity.mockResolvedValue({
      data: { provider: 'google', url: null },
      error: {
        code: 'manual_linking_disabled',
        message: 'secret detail ada@example.com',
      },
    });

    const state = await connectAccount({}, form({ provider: 'google' }));

    expect(state.error).toBe(
      'Connecting accounts is not turned on for this app yet.',
    );
    expect(warn).toHaveBeenCalledWith('connectAccount failed', {
      provider: 'google',
      code: 'manual_linking_disabled',
    });
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(/secret|ada@example/);
    warn.mockRestore();
  });

  it('shows a rate limit', async () => {
    mocks.linkIdentity.mockResolvedValue({
      data: { provider: 'google', url: null },
      error: { code: 'over_request_rate_limit' },
    });

    const state = await connectAccount({}, form({ provider: 'google' }));

    expect(state.error).toBe(
      'Too many attempts. Wait a few minutes and try again.',
    );
  });
});

describe('requestAccountDeletion', () => {
  const OWN = 'ada@example.com';
  beforeEach(() => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: OWN } },
      error: null,
    });
    mocks.signInWithOtp.mockResolvedValue({ data: {}, error: null });
  });

  it('emails the link when the typed address is the right one, and says nothing is deleted yet', async () => {
    const state = await requestAccountDeletion({}, form({ email: OWN }));

    expect(mocks.signInWithOtp).toHaveBeenCalledExactlyOnceWith({
      email: OWN,
      options: {
        shouldCreateUser: false,
        emailRedirectTo:
          'https://app.test/auth/callback?next=%2Fauth%2Fdelete-account&flow=delete-account',
      },
    });
    expect(state.success).toBe(true);
    expect(state.message).toContain('Nothing is deleted until you confirm');
  });

  it('refuses a wrong address on the field, and sends nothing', async () => {
    const state = await requestAccountDeletion(
      {},
      form({ email: 'someone@else.test' }),
    );

    expect(state.error).toBe('That is not the email address on this account.');
    expect(state.fields).toEqual(['email']);
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('refuses an empty address before asking the provider', async () => {
    mocks.getUser.mockClear();

    const state = await requestAccountDeletion({}, form({ email: '' }));

    expect(state.error).toBeTruthy();
    expect(state.fields).toEqual(['email']);
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('offers sign-in when the session has gone', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found' },
    });

    const state = await requestAccountDeletion({}, form({ email: OWN }));

    expect(state.signedOut).toBe(true);
  });

  it('shows a rate limit, and is honest about other failures while logging only the code', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: { code: 'over_email_send_rate_limit' },
    });
    expect((await requestAccountDeletion({}, form({ email: OWN }))).error).toBe(
      'Too many attempts. Wait a few minutes and try again.',
    );

    mocks.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: { code: 'unexpected_failure', message: `failed for ${OWN}` },
    });
    const state = await requestAccountDeletion({}, form({ email: OWN }));

    expect(state.error).toBe('Something went wrong. Try again.');
    expect(JSON.stringify(warn.mock.calls)).not.toContain(OWN);
  });
});

describe('disconnectAccount', () => {
  const github = { identity_id: 'i-2', provider: 'github' };
  const email = { identity_id: 'i-1', provider: 'email' };

  beforeEach(() => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: USER_ID, email: 'ada@example.com' } },
      error: null,
    });
    mocks.getUserIdentities.mockResolvedValue({
      data: { identities: [email, github] },
      error: null,
    });
    mocks.unlinkIdentity.mockResolvedValue({ data: {}, error: null });
  });

  it('disconnects, refreshes what is shown, and says so', async () => {
    mocks.revalidatePath.mockClear();

    const state = await disconnectAccount({}, form({ provider: 'github' }));

    expect(mocks.unlinkIdentity).toHaveBeenCalledExactlyOnceWith(github);
    expect(state.success).toBe(true);
    expect(state.message).toBe('Account disconnected.');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it.each(['', 'facebook', 'email', '__proto__'])(
    'refuses %j as a provider, before any call',
    async (provider) => {
      mocks.getUserIdentities.mockClear();

      const state = await disconnectAccount({}, form({ provider }));

      expect(state.error).toBe('Something went wrong. Try again.');
      expect(mocks.getUserIdentities).not.toHaveBeenCalled();
    },
  );

  it('needs a session, and offers sign-in', async () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: { code: 'x' } });

    const state = await disconnectAccount({}, form({ provider: 'github' }));

    expect(state.signedOut).toBe(true);
    expect(mocks.unlinkIdentity).not.toHaveBeenCalled();
  });

  it('explains the only way to sign in, and changes nothing', async () => {
    mocks.getUserIdentities.mockResolvedValue({
      data: { identities: [github] },
      error: null,
    });

    const state = await disconnectAccount({}, form({ provider: 'github' }));

    expect(state.error).toBe(
      'That is your only way to sign in. Add a password or connect another account first.',
    );
    expect(mocks.unlinkIdentity).not.toHaveBeenCalled();
  });

  it('words a project with linking switched off, logging only the code', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.unlinkIdentity.mockResolvedValue({
      data: null,
      error: { code: 'manual_linking_disabled', message: 'ada@example.com' },
    });

    const state = await disconnectAccount({}, form({ provider: 'github' }));

    expect(state.error).toBe(
      'Connecting accounts is not turned on for this app yet.',
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain('ada@example.com');
  });
});

describe('development fixture mode', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
  });
  afterEach(() => vi.unstubAllEnvs());

  const valid = form({
    email: 'a@b.test',
    password: STRONG,
    confirm: STRONG,
    name: 'Ada',
    provider: 'google',
  });

  // Includes the actions that check `getCurrentUser()`, which in fixture mode
  // returns the fixture user: the guard must stop them before that check.
  it('rejects every form action before a Supabase client is built', async () => {
    const results = await Promise.all([
      signInWithPassword({}, valid),
      signUp({}, valid),
      resendConfirmation({}, valid),
      requestPasswordReset({}, valid),
      updatePassword({}, valid),
      requestEmailChange({}, valid),
      resendEmailChange({}, valid),
      requestOwnPasswordReset({}, valid),
      connectAccount({}, valid),
      requestAccountDeletion({}, valid),
      disconnectAccount({}, valid),
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
