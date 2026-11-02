import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { isProtectedPath } from '../../lib/routing/route-access';

/**
 * The `(protected)` route group is route organization, not a security
 * mechanism: it adds no URL segment, so the proxy still decides by URL
 * (`isProtectedPath`), and every page still checks access itself, because a
 * layout does not re-run on client navigation. This test ties the three
 * together so they cannot drift apart unnoticed.
 *
 * What a page must call depends on what it is addressed by:
 * - Under `[userId]` the URL names an owner, so the page must call
 *   `requireOwner`, which checks the visitor *is* that owner.
 * - Any other authenticated page has a different authorization question (a
 *   shared record, an invitation). `requireOwner` would be wrong there, so it
 *   is not required; the page must call one of `OTHER_ACCESS_GUARDS`. A new
 *   guard is added to that list deliberately, with the design that needs it.
 *
 * A lexical scan of the folder, like `architecture.test.ts`: it proves a page
 * calls a guard, not that the call is reached on every path.
 */

const GROUP = dirname(fileURLToPath(import.meta.url));
const APP = join(GROUP, '..');

/** Guards for pages not addressed by an owner. Empty calls are not enough: each is an identity check. */
const OTHER_ACCESS_GUARDS = ['getVerifiedIdentity(', 'requireSignedIn('];

/**
 * Pages the proxy deliberately does not match, with the reason. `/<userId>`
 * cannot be told apart from a public one-segment page by its shape, so the
 * proxy leaves it to the app: it has no content, it only redirects to the
 * person's home. A signed-out visitor is sent to sign in by the group layout,
 * with the path the proxy forwards in a header as `next`, and a signed-in
 * stranger gets a 404 from `requireOwner`.
 */
const NOT_MATCHED_BY_PROXY = new Set(['/some-user']);

function pagesIn(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pagesIn(path);
    return entry.name === 'page.tsx' ? [path] : [];
  });
}

/** The folder segments of a page, route groups removed. */
function segmentsOf(page: string): string[] {
  return relative(GROUP, dirname(page))
    .split('/')
    .filter((segment) => segment && !/^\(.*\)$/.test(segment));
}

/** Whether the URL names an owner (`/[userId]/...`), as opposed to any other authenticated page. */
export function isOwnerAddressed(segments: string[]): boolean {
  return segments[0] === '[userId]';
}

/** What a page's source must contain, by how its URL is addressed. */
export function requiredGuards(segments: string[]): string[] {
  return isOwnerAddressed(segments) ? ['requireOwner('] : OTHER_ACCESS_GUARDS;
}

/** The URL a page is served at, with a sample for each dynamic segment. */
function urlOf(page: string): string {
  const segments = segmentsOf(page)
    .map((segment) => (segment === '[userId]' ? 'some-user' : segment))
    .map((segment) => segment.replace(/^\[.+\]$/, 'some-id'));
  return `/${segments.join('/')}`;
}

describe('guard requirements by addressing', () => {
  it('requires the owner check for a page under [userId]', () => {
    expect(requiredGuards(['[userId]', 'home'])).toEqual(['requireOwner(']);
    expect(requiredGuards(['[userId]'])).toEqual(['requireOwner(']);
  });

  it('does not require the owner check for a page that is not addressed by an owner', () => {
    for (const segments of [['invitations'], ['shared', '[shareId]'], []]) {
      const guards = requiredGuards(segments);
      expect(guards).not.toContain('requireOwner(');
      expect(guards.length).toBeGreaterThan(0);
    }
  });
});

describe('the (protected) route group', () => {
  const pages = pagesIn(GROUP);

  it('finds the owner-area pages', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it('has a layout that requires someone to be signed in', () => {
    const layout = join(GROUP, 'layout.tsx');
    expect(existsSync(layout)).toBe(true);
    expect(readFileSync(layout, 'utf8')).toContain('requireSignedIn(');
  });

  it('checks the owner in the layout that every owner-addressed page shares', () => {
    const layout = join(GROUP, '[userId]', 'layout.tsx');
    expect(readFileSync(layout, 'utf8')).toContain('requireOwner(');
  });

  it('keeps every owner-addressed route inside the group', () => {
    // A branch merged later could re-create `app/[userId]` beside the group;
    // that route would be guarded by the proxy and its own checks but would
    // sit outside what this test reads.
    expect(existsSync(join(APP, '[userId]'))).toBe(false);
  });

  it.each(pages.map((page) => [relative(APP, page), page]))(
    '%s calls the guard its addressing requires',
    (_name, page) => {
      const source = readFileSync(page, 'utf8');
      const guards = requiredGuards(segmentsOf(page));
      expect(guards.some((guard) => source.includes(guard))).toBe(true);
    },
  );

  it.each(pages.map((page) => [urlOf(page), page]))(
    '%s is a path the proxy protects',
    (url) => {
      expect(isProtectedPath(url) || NOT_MATCHED_BY_PROXY.has(url)).toBe(true);
    },
  );

  it('keeps the proxy exemptions to pages that exist', () => {
    const urls = new Set(pages.map(urlOf));
    for (const url of NOT_MATCHED_BY_PROXY) expect(urls).toContain(url);
  });
});
