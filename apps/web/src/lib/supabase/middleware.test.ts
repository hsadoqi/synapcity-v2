import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The adapter between Next's proxy and `@supabase/ssr`. The SDK is stubbed at
 * its boundary: `getClaims()` plays the part of a token refresh by calling the
 * adapter's `setAll` with a cookie and the cache headers the SDK sends with it.
 */

type CookieToSet = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};
type SetAll = (cookies: CookieToSet[], headers: Record<string, string>) => void;

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  Expires: '0',
  Pragma: 'no-cache',
};
const REFRESHED = {
  name: 'sb-test-auth-token',
  value: 'refreshed',
  options: {},
};

const sdk = vi.hoisted(() => ({
  claims: null as { sub: string } | null,
  error: null as unknown,
  throws: null as unknown,
  refreshes: true,
  clients: 0,
}));

vi.mock('./env', () => ({
  getSupabaseEnv: () => ({
    url: 'https://project.test',
    publishableKey: 'pk',
  }),
}));
vi.mock('@supabase/ssr', () => ({
  createServerClient: (
    _url: string,
    _key: string,
    { cookies }: { cookies: { setAll: SetAll } },
  ) => {
    sdk.clients += 1;
    return {
      auth: {
        getClaims: async () => {
          if (sdk.refreshes) cookies.setAll([REFRESHED], CACHE_HEADERS);
          if (sdk.throws) throw sdk.throws;
          if (sdk.error) return { data: null, error: sdk.error };
          return { data: sdk.claims ? { claims: sdk.claims } : null };
        },
      },
    };
  },
}));

import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import { REQUEST_PATH_HEADER } from '../routing/request-path';
import { updateSession } from './middleware';

const request = (path: string) =>
  new NextRequest(new URL(path, 'https://app.test'));

function expectSessionCarried(response: Response) {
  for (const [name, value] of Object.entries(CACHE_HEADERS)) {
    expect(response.headers.get(name)).toBe(value);
  }
  expect(response.headers.get('set-cookie')).toContain(
    `${REFRESHED.name}=${REFRESHED.value}`,
  );
}

beforeEach(() => {
  sdk.claims = null;
  sdk.error = null;
  sdk.throws = null;
  sdk.refreshes = true;
  sdk.clients = 0;
});

afterEach(() => vi.unstubAllEnvs());

describe('updateSession', () => {
  it('passes the refreshed cookie and the cache headers on', async () => {
    sdk.claims = { sub: 'user-1' };

    const response = await updateSession(request('/user-1/home'));

    expect(response.headers.get('location')).toBeNull();
    expectSessionCarried(response);
  });

  it('keeps both on the redirect away from a guest-only page', async () => {
    sdk.claims = { sub: 'user-1' };

    const response = await updateSession(request('/auth/login'));

    expect(response.headers.get('location')).toBe(
      'https://app.test/user-1/home',
    );
    expectSessionCarried(response);
  });

  it('keeps both on the redirect to sign in', async () => {
    const response = await updateSession(request('/user-1/settings?tab=a'));

    expect(response.headers.get('location')).toBe(
      'https://app.test/auth/login?next=%2Fuser-1%2Fsettings%3Ftab%3Da',
    );
    expectSessionCarried(response);
  });

  it('adds no cache headers when the SDK wrote no cookies', async () => {
    sdk.refreshes = false;

    const response = await updateSession(request('/'));

    expect(response.headers.get('cache-control')).toBeNull();
  });
});

describe('updateSession when the Auth service cannot answer', () => {
  const outages = [
    ['a dropped connection', new AuthRetryableFetchError('fetch failed', 0)],
    ['a 503', new AuthApiError('down', 503, 'unexpected_failure')],
  ] as const;

  it.each(outages)(
    'answers a protected page with a 503 and no redirect (%s)',
    async (_name, error) => {
      sdk.error = error;

      const response = await updateSession(request('/user-1/home'));

      expect(response.status).toBe(503);
      expect(response.headers.get('location')).toBeNull();
      expect(response.headers.get('x-middleware-rewrite')).toBe(
        'https://app.test/auth/unavailable',
      );
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('set-cookie')).toContain(REFRESHED.name);
    },
  );

  it('answers 503 when getClaims throws', async () => {
    sdk.throws = new TypeError('fetch failed');

    const response = await updateSession(request('/user-1/settings'));

    expect(response.status).toBe(503);
  });

  it.each(['/', '/auth/login', '/auth/unavailable', '/about'])(
    'lets the public path %s through',
    async (path) => {
      sdk.error = new AuthRetryableFetchError('fetch failed', 0);

      const response = await updateSession(request(path));

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    },
  );

  it('still redirects to sign in when the service answered "no session"', async () => {
    sdk.error = new AuthApiError('gone', 400, 'refresh_token_not_found');

    const response = await updateSession(request('/user-1/home'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/login');
  });
});

describe('updateSession in development fixture mode', () => {
  it('passes every request through without building a Supabase client', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');

    for (const path of ['/fixture-user/home', '/auth/login', '/']) {
      const response = await updateSession(request(path));
      expect(response.headers.get('location')).toBeNull();
    }
    expect(sdk.clients).toBe(0);
  });

  it('still protects routes in production even with the flag set', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');

    const response = await updateSession(request('/user-1/home'));

    expect(response.headers.get('location')).toContain('/auth/login');
    expect(sdk.clients).toBe(1);
  });

  describe('the request path header', () => {
    // Next passes the headers a proxy sets on the request to the app as
    // `x-middleware-request-<name>` on the proxy's response.
    const forwarded = (response: Response) =>
      response.headers.get(`x-middleware-request-${REQUEST_PATH_HEADER}`);

    it('carries the path and query to the app on a page that passes through', async () => {
      sdk.claims = { sub: 'user-1' };

      const response = await updateSession(request('/user-1?tab=a'));

      expect(forwarded(response)).toBe('/user-1?tab=a');
    });

    it('replaces a value the client sent, so it cannot choose the way back', async () => {
      sdk.claims = { sub: 'user-1' };
      const spoofed = new NextRequest(new URL('/user-1', 'https://app.test'), {
        headers: { [REQUEST_PATH_HEADER]: '//evil.example/steal' },
      });

      const response = await updateSession(spoofed);

      expect(spoofed.headers.get(REQUEST_PATH_HEADER)).toBe('/user-1');
      expect(forwarded(response)).toBe('/user-1');
    });

    it('replaces it when the proxy redirects, too', async () => {
      const spoofed = new NextRequest(
        new URL('/user-1/home', 'https://app.test'),
        { headers: { [REQUEST_PATH_HEADER]: '/elsewhere' } },
      );

      const response = await updateSession(spoofed);

      expect(response.headers.get('location')).toContain(
        'next=%2Fuser-1%2Fhome',
      );
      expect(spoofed.headers.get(REQUEST_PATH_HEADER)).toBe('/user-1/home');
    });
  });
});
