import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
});
