import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { config } from './proxy';
import { isGuestOnlyPath, isProtectedPath } from './lib/routing/route-access';

/**
 * The `(public)`, `(auth)` and `(protected)` route groups split page chrome by
 * route family without adding a URL segment. This file pins what must not
 * change when routes move between them or new ones are added: the URLs people
 * and email links rely on, where each family lives, and what the proxy does
 * with it. How the layouts and boundaries behave when rendered is in
 * `route-groups.dom.test.tsx`; the effective metadata and landmarks in a
 * browser are in `e2e/route-groups.e2e.ts`.
 */

const APP = join(dirname(fileURLToPath(import.meta.url)), 'app');
const GROUP = /^\(.*\)$/;

function filesIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

/** Every page and route handler: its URL pattern and the route group it sits in. */
const routes = filesIn(APP)
  .filter((file) => /\/(page\.tsx|route\.ts)$/.test(file))
  .map((file) => {
    const segments = relative(APP, dirname(file)).split('/').filter(Boolean);
    return {
      group: segments.find((segment) => GROUP.test(segment)) ?? null,
      url: '/' + segments.filter((segment) => !GROUP.test(segment)).join('/'),
    };
  });

const urlsIn = (group: string) =>
  routes.filter((route) => route.group === group).map((route) => route.url);

/** A URL with each dynamic segment replaced by a sample value. */
const sample = (url: string) => url.replace(/\[[^\]]+\]/g, 'sample');

describe('URLs are unchanged by the route groups', () => {
  it('still serves the public pages from the (public) group', () => {
    expect(urlsIn('(public)')).toEqual(
      expect.arrayContaining(['/', '/privacy']),
    );
  });

  it('still serves every account-flow URL and the callback from the (auth) group', () => {
    expect(urlsIn('(auth)')).toEqual(
      expect.arrayContaining([
        '/auth/callback',
        '/auth/delete-account',
        '/auth/error',
        '/auth/forgot-password',
        '/auth/login',
        '/auth/register',
        '/auth/update-password',
        '/auth/welcome',
      ]),
    );
  });

  it('keeps everything under /auth in the (auth) group and nothing else there', () => {
    for (const route of routes) {
      expect(route.url.startsWith('/auth/'), route.url).toBe(
        route.group === '(auth)',
      );
    }
  });

  it('keeps the owner area, and only it, in the (protected) group', () => {
    for (const route of routes.filter((r) => r.group === '(protected)')) {
      expect(route.url, route.url).toMatch(/^\/\[userId\]/);
    }
    expect(urlsIn('(protected)')).toEqual(
      expect.arrayContaining(['/[userId]/home', '/[userId]/settings']),
    );
  });

  it('puts every page in a group, leaving only the API and the bare owner root outside', () => {
    // `/[userId]` redirects and has no shell. It sits outside `(protected)` so
    // its own `requireOwner` runs before the group layout's sign-in backstop,
    // which cannot keep the return path (see `protected-routes.test.ts`).
    const outside = routes.filter((route) => route.group === null);
    expect(outside.map((route) => route.url).sort()).toEqual(
      outside
        .filter(
          (route) => route.url.startsWith('/api/') || route.url === '/[userId]',
        )
        .map((r) => r.url)
        .sort(),
    );
    expect(existsSync(join(APP, 'page.tsx'))).toBe(false);
  });

  it('lets only the root layout own the document', () => {
    const documents = filesIn(APP).filter(
      (file) =>
        /\/layout\.tsx$/.test(file) &&
        readFileSync(file, 'utf8').includes('<html'),
    );
    expect(documents).toEqual([join(APP, 'layout.tsx')]);
  });
});

describe('the proxy still decides by URL, not by group', () => {
  it('does not turn a group folder name into a matcher', () => {
    expect(config.matcher.join('')).not.toMatch(/\((public|auth|protected)\)/);
  });

  it('never asks for a session on a public or auth URL', () => {
    for (const url of [...urlsIn('(public)'), ...urlsIn('(auth)')]) {
      expect(isProtectedPath(sample(url)), url).toBe(false);
    }
  });

  it('asks for a session on the owner area', () => {
    for (const url of ['/[userId]/home', '/[userId]/settings']) {
      expect(isProtectedPath(sample(url)), url).toBe(true);
    }
  });

  it('keeps sign-in and sign-up the only guest-only pages', () => {
    const guestOnly = urlsIn('(auth)').filter((url) => isGuestOnlyPath(url));
    expect(guestOnly.sort()).toEqual(['/auth/login', '/auth/register']);
  });
});

describe('boundaries Next selects by file name', () => {
  it('gives each group its own not-found, and the owner area an error boundary', () => {
    for (const group of ['(public)', '(auth)', '(protected)']) {
      expect(existsSync(join(APP, group, 'not-found.tsx')), group).toBe(true);
    }
    expect(existsSync(join(APP, '(protected)', 'error.tsx'))).toBe(true);
  });

  it('keeps root boundaries for what no group handles', () => {
    for (const file of ['error.tsx', 'not-found.tsx', 'global-error.tsx']) {
      expect(existsSync(join(APP, file)), file).toBe(true);
    }
  });
});
