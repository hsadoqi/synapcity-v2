import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ exchangeCodeForSession: vi.fn() }));

// Only the Supabase exchange is replaced. The handler, `safeNextPath` and the
// auth-flow helpers run for real, so this checks the handler's decisions and
// not a real PKCE link or OAuth session.
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
  }),
}));

import { GET } from './route';

const ORIGIN = 'https://app.test';
const USER_ID = 'user-123';
const HOME = '/user-123/home';

function request(query: Record<string, string>): NextRequest {
  const url = new URL(`${ORIGIN}/auth/callback`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

function exchangeSucceeds() {
  mocks.exchangeCodeForSession.mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  });
}

function location(response: Response): string {
  const header = response.headers.get('location');
  if (header === null) throw new Error('response did not redirect');
  return header;
}

describe('GET /auth/callback', () => {
  beforeEach(() => {
    mocks.exchangeCodeForSession.mockReset();
  });

  describe('a valid code', () => {
    it('exchanges the code once and follows a safe next path', async () => {
      exchangeSucceeds();
      const response = await GET(
        request({ code: 'abc', next: '/user-123/settings', flow: 'oauth' }),
      );
      expect(mocks.exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith(
        'abc',
      );
      expect(location(response)).toBe(`${ORIGIN}/user-123/settings`);
    });

    it('sends the user to their own home when next is missing', async () => {
      exchangeSucceeds();
      const response = await GET(request({ code: 'abc' }));
      expect(location(response)).toBe(`${ORIGIN}${HOME}`);
    });

    it.each([
      ['an absolute external URL', 'https://evil.test/steal'],
      ['a protocol-relative URL', '//evil.test/steal'],
      ['a backslash protocol-relative URL', '/\\evil.test/steal'],
      ['a script URL', 'javascript:alert(1)'],
    ])('falls back to home for %s', async (_label, next) => {
      exchangeSucceeds();
      const response = await GET(request({ code: 'abc', next }));
      expect(location(response)).toBe(`${ORIGIN}${HOME}`);
    });

    it('never leaves the app origin', async () => {
      exchangeSucceeds();
      const response = await GET(
        request({ code: 'abc', next: '//evil.test/steal' }),
      );
      expect(new URL(location(response)).origin).toBe(ORIGIN);
    });
  });

  describe('a failed callback', () => {
    it('does not call the exchange when the code is missing', async () => {
      const response = await GET(request({ flow: 'confirm' }));
      expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
      expect(location(response)).toBe(`${ORIGIN}/auth/error?reason=confirm`);
    });

    it.each([
      ['confirm', '/auth/error?reason=confirm'],
      ['reset', '/auth/error?reason=reset'],
      ['oauth', '/auth/error?reason=oauth'],
    ])('names the %s flow when the exchange fails', async (flow, path) => {
      mocks.exchangeCodeForSession.mockResolvedValue({
        data: { user: null },
        error: { code: 'validation_failed', message: 'secret-provider-text' },
      });
      const response = await GET(request({ code: 'abc', flow }));
      expect(location(response)).toBe(`${ORIGIN}${path}`);
    });

    it.each([
      ['confirm', '/auth/error?reason=confirm'],
      ['reset', '/auth/error?reason=reset'],
      ['oauth', '/auth/error?reason=oauth'],
    ])(
      'names the %s flow when the exchange returns no user',
      async (flow, path) => {
        mocks.exchangeCodeForSession.mockResolvedValue({
          data: { user: null },
          error: null,
        });
        const response = await GET(request({ code: 'abc', flow }));
        expect(location(response)).toBe(`${ORIGIN}${path}`);
      },
    );

    it.each([
      ['an unknown flow', { code: 'abc', flow: 'sso' }],
      ['no flow', { code: 'abc' }],
    ])('uses the plain error page for %s', async (_label, query) => {
      mocks.exchangeCodeForSession.mockResolvedValue({
        data: { user: null },
        error: { code: 'x', message: 'y' },
      });
      const response = await GET(request(query));
      expect(location(response)).toBe(`${ORIGIN}/auth/error`);
    });

    it('does not put provider messages, codes or tokens in the redirect', async () => {
      mocks.exchangeCodeForSession.mockResolvedValue({
        data: { user: null },
        error: {
          code: 'sentinel-code',
          message: 'sentinel-message',
          access_token: 'sentinel-token',
        },
      });
      const response = await GET(
        request({ code: 'sentinel-code', flow: 'reset' }),
      );
      const where = location(response);
      expect(where).not.toMatch(/sentinel/);
      expect(await response.text()).not.toMatch(/sentinel/);
    });
  });

  describe('a new account', () => {
    const DAY = 24 * 60 * 60 * 1000;
    const NOW = Date.parse('2026-10-17T12:00:00Z');

    const signsIn = (user: Record<string, unknown>) =>
      mocks.exchangeCodeForSession.mockResolvedValue({
        data: { user: { id: USER_ID, ...user } },
        error: null,
      });
    const fresh = { created_at: new Date(NOW - DAY).toISOString() };
    const welcome = (next: string) =>
      `${ORIGIN}/auth/welcome?next=${encodeURIComponent(next)}`;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it.each(['oauth', 'confirm'])(
      'is sent to confirm its name and photo after a %s sign-in',
      async (flow) => {
        signsIn({ ...fresh, user_metadata: {} });

        const response = await GET(request({ code: 'abc', flow }));

        expect(location(response)).toBe(welcome(HOME));
      },
    );

    it('carries the destination it was going to, validated, through the step', async () => {
      signsIn({ ...fresh });

      const response = await GET(
        request({
          code: 'abc',
          flow: 'oauth',
          next: '/user-123/settings?tab=2',
        }),
      );

      expect(location(response)).toBe(welcome('/user-123/settings?tab=2'));
    });

    it('never carries an unsafe destination, and never leaves the origin', async () => {
      signsIn({ ...fresh });

      const response = await GET(
        request({ code: 'abc', flow: 'oauth', next: '//evil.test/steal' }),
      );

      expect(location(response)).toBe(welcome(HOME));
      expect(new URL(location(response)).origin).toBe(ORIGIN);
    });

    it('is not sent there after a password reset', async () => {
      signsIn({ ...fresh });

      const response = await GET(request({ code: 'abc', flow: 'reset' }));

      expect(location(response)).toBe(`${ORIGIN}${HOME}`);
    });

    it.each([
      ['no flow', {}],
      ['an unknown flow', { flow: 'sso' }],
    ])('is not sent there with %s', async (_label, extra) => {
      signsIn({ ...fresh });

      const response = await GET(request({ code: 'abc', ...extra }));

      expect(location(response)).toBe(`${ORIGIN}${HOME}`);
    });

    it('is not asked again once it finished or skipped the step', async () => {
      signsIn({ ...fresh, user_metadata: { profile_confirmed: true } });

      const response = await GET(request({ code: 'abc', flow: 'oauth' }));

      expect(location(response)).toBe(`${ORIGIN}${HOME}`);
    });

    it('is left alone when the account is older than a new one', async () => {
      signsIn({ created_at: new Date(NOW - 90 * DAY).toISOString() });

      const response = await GET(request({ code: 'abc', flow: 'oauth' }));

      expect(location(response)).toBe(`${ORIGIN}${HOME}`);
    });

    it.each([
      ['no creation date', {}],
      ['an unreadable creation date', { created_at: 'yesterday-ish' }],
    ])(
      'is left alone with %s, so doubt never adds a step',
      async (_l, user) => {
        signsIn(user);

        const response = await GET(request({ code: 'abc', flow: 'oauth' }));

        expect(location(response)).toBe(`${ORIGIN}${HOME}`);
      },
    );

    it('does not reach the step when the sign-in fails', async () => {
      mocks.exchangeCodeForSession.mockResolvedValue({
        data: { user: null },
        error: { code: 'x', message: 'y' },
      });

      const response = await GET(request({ code: 'abc', flow: 'oauth' }));

      expect(location(response)).toBe(`${ORIGIN}/auth/error?reason=oauth`);
    });
  });

  describe('a confirmed email change', () => {
    const SETTINGS = '/user-123/settings';
    const arrives = (path: string) => `${ORIGIN}${path}`;

    it('returns to where it was asked for, saying the address was updated', async () => {
      exchangeSucceeds();

      const response = await GET(
        request({ code: 'abc', flow: 'email-change', next: SETTINGS }),
      );

      expect(location(response)).toBe(
        arrives(`${SETTINGS}?notice=email-updated`),
      );
    });

    it('goes to their own home when no destination came back', async () => {
      exchangeSucceeds();

      const response = await GET(
        request({ code: 'abc', flow: 'email-change' }),
      );

      expect(location(response)).toBe(arrives(`${HOME}?notice=email-updated`));
    });

    it('never follows an unsafe destination off the origin', async () => {
      exchangeSucceeds();

      const response = await GET(
        request({
          code: 'abc',
          flow: 'email-change',
          next: '//evil.test/steal',
        }),
      );

      expect(location(response)).toBe(arrives(`${HOME}?notice=email-updated`));
      expect(new URL(location(response)).origin).toBe(ORIGIN);
    });

    it('is not sent to confirm a profile, even on a brand-new account', async () => {
      mocks.exchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            id: USER_ID,
            created_at: new Date().toISOString(),
            user_metadata: {},
          },
        },
        error: null,
      });

      const response = await GET(
        request({ code: 'abc', flow: 'email-change', next: SETTINGS }),
      );

      expect(location(response)).not.toContain('/auth/welcome');
    });

    it('names its own flow when the link fails', async () => {
      mocks.exchangeCodeForSession.mockResolvedValue({
        data: { user: null },
        error: { code: 'otp_expired', message: 'secret-provider-text' },
      });

      const response = await GET(
        request({ code: 'abc', flow: 'email-change' }),
      );

      expect(location(response)).toBe(
        arrives('/auth/error?reason=email-change'),
      );
    });

    describe('the first of two confirmations', () => {
      const accepted = (extra: Record<string, string> = {}) =>
        request({
          flow: 'email-change',
          next: SETTINGS,
          message:
            'Confirmation link accepted. Please proceed to confirm link sent to the other email',
          ...extra,
        });

      it('is not a failure: it comes back with a message and no code', async () => {
        const response = await GET(accepted());

        expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
        expect(location(response)).toBe(
          arrives(`${SETTINGS}?notice=email-change-step`),
        );
      });

      it("shows our wording, never the provider's message text", async () => {
        const response = await GET(
          accepted({ message: 'sentinel-provider-text' }),
        );

        expect(location(response)).not.toMatch(/sentinel/);
      });

      it('is still a failure if the provider reports an error', async () => {
        const failures: Record<string, string>[] = [
          { error: 'access_denied' },
          { error_code: 'otp_expired' },
        ];
        for (const error of failures) {
          const response = await GET(accepted(error));

          expect(location(response)).toBe(
            arrives('/auth/error?reason=email-change'),
          );
        }
      });

      it('needs the email-change tag, so other flows are not affected', async () => {
        const response = await GET(
          request({ flow: 'confirm', message: 'anything' }),
        );

        expect(location(response)).toBe(arrives('/auth/error?reason=confirm'));
      });

      it('is a failure with no message at all', async () => {
        const response = await GET(request({ flow: 'email-change' }));

        expect(location(response)).toBe(
          arrives('/auth/error?reason=email-change'),
        );
      });

      it('never leaves the origin, whatever destination it was given', async () => {
        const response = await GET(accepted({ next: '//evil.test/steal' }));

        expect(new URL(location(response)).origin).toBe(ORIGIN);
        expect(location(response)).toBe(arrives('/?notice=email-change-step'));
      });
    });
  });
});
