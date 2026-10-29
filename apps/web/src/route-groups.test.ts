import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { config } from './proxy';

/**
 * The `(public)`, `(auth)` and `(protected)` route groups split page chrome
 * by route family without adding a URL segment. A lexical scan, like
 * `protected-routes.test.ts`: it pins who owns the document, the shell and the
 * access rule, so a later move cannot quietly change them.
 */

const APP = join(dirname(fileURLToPath(import.meta.url)), 'app');
const read = (path: string) => readFileSync(join(APP, path), 'utf8');

function routesIn(dir: string, file: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return routesIn(path, file);
    return file.test(entry.name) ? [path] : [];
  });
}

/** The URL path a page or route handler is served at, groups removed. */
const urlOf = (file: string) =>
  '/' +
  relative(APP, dirname(file))
    .split('/')
    .filter((segment) => segment && !/^\(.*\)$/.test(segment))
    .join('/');

const urlsIn = (group: string, file = /^(page\.tsx|route\.ts)$/) =>
  routesIn(join(APP, group), file).map(urlOf).sort();

describe('URLs are unchanged by the route groups', () => {
  it('serves the public pages at / and /privacy', () => {
    expect(urlsIn('(public)')).toEqual(['/', '/privacy']);
  });

  it('serves every account-flow page and the callback under /auth', () => {
    expect(urlsIn('(auth)')).toEqual([
      '/auth/callback',
      '/auth/delete-account',
      '/auth/error',
      '/auth/forgot-password',
      '/auth/login',
      '/auth/register',
      '/auth/update-password',
      '/auth/welcome',
    ]);
  });

  it('keeps /auth and the public pages out of the other groups and the app root', () => {
    expect(existsSync(join(APP, 'auth'))).toBe(false);
    expect(existsSync(join(APP, 'page.tsx'))).toBe(false);
    expect(existsSync(join(APP, 'privacy'))).toBe(false);
  });

  it('does not let a group name become a URL matcher in the proxy', () => {
    expect(config.matcher.join('')).not.toMatch(/public|auth\)|protected/);
  });
});

describe('layout ownership', () => {
  it('keeps the document, and only the document, in the root layout', () => {
    const layouts = routesIn(APP, /^layout\.tsx$/).filter((file) =>
      readFileSync(file, 'utf8').includes('<html'),
    );
    expect(layouts).toEqual([join(APP, 'layout.tsx')]);
  });

  it('keeps page chrome out of the root layout', () => {
    const root = read('layout.tsx');
    expect(root).not.toMatch(/AppShell|PublicShell|AuthPageShell/);
    expect(root).toContain('RootProviders');
    expect(root).toContain('modeBootScript');
  });

  it('gives the protected group the workspace shell and the others the public shell', () => {
    expect(read('(protected)/layout.tsx')).toContain('<AppShell');
    expect(read('(public)/layout.tsx')).toContain('<PublicShell');
    expect(read('(auth)/layout.tsx')).toContain('<PublicShell');
    expect(read('(auth)/layout.tsx')).toContain('<AuthPageShell>');
    for (const group of ['(public)', '(auth)']) {
      expect(read(`${group}/layout.tsx`)).not.toContain('AppShell');
    }
  });

  it('gives the root boundaries a shell of their own', () => {
    expect(read('error.tsx')).toContain('<PublicShell>');
    expect(read('not-found.tsx')).toContain('<PublicShell>');
  });
});

describe('access is decided by the page, not by the presentation groups', () => {
  it('adds no session check or redirect to the public or auth layouts', () => {
    for (const group of ['(public)', '(auth)']) {
      expect(read(`${group}/layout.tsx`)).not.toMatch(
        /requireSignedIn|requireOwner|getVerifiedClaims|getVerifiedIdentity|redirect\(/,
      );
    }
  });

  it('keeps the session check in the flows that need a session', () => {
    for (const page of ['welcome', 'update-password', 'delete-account']) {
      expect(read(`(auth)/auth/${page}/page.tsx`)).toContain(
        'getVerifiedClaims()',
      );
    }
  });
});

describe('metadata inheritance', () => {
  it('sets the site metadata once, in the root layout', () => {
    expect(read('layout.tsx')).toContain('createMetadata(');
  });

  it('does not redefine Open Graph in a group layout, which would replace the root image', () => {
    for (const group of ['(public)', '(auth)', '(protected)']) {
      expect(read(`${group}/layout.tsx`)).not.toMatch(
        /createMetadata|openGraph/,
      );
    }
  });

  it('gives every auth page its own title', () => {
    const pages = routesIn(join(APP, '(auth)'), /^page\.tsx$/);
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) {
      expect(readFileSync(page, 'utf8'), page).toMatch(
        /export const metadata[^=]*= \{ title: /,
      );
    }
  });
});
