import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Who-is-calling checks go through the identity boundary (Milestone 4):
 * `getVerifiedIdentity` and `requireOwner` for reads, `getCallerIdentity` for
 * Server Actions, both built on `@synapcity/server-auth`. Calling Supabase's
 * `auth.getClaims()` or `auth.getUser()` directly is allowed only where it is
 * listed here, each with the milestone that removes or keeps it. A new direct
 * call fails this test; so does a listed call that is gone, so the list only
 * shrinks. A lexical scan of non-test source with `//` and block comments
 * stripped; it does not follow aliases such as `const { auth } = supabase`.
 */
const ALLOWED: Record<string, { calls: number; reason: string }> = {
  'features/auth/server/session/session.ts': {
    calls: 2,
    reason:
      'Canonical claims read (getVerifiedClaims, reused by the boundary) and the provider record for display (M7).',
  },
  'features/auth/server/operations/operations.ts': {
    calls: 5,
    reason: 'Auth operations need the provider user record (M7).',
  },
  'features/account/server/caller.ts': {
    calls: 1,
    reason:
      'getCaller returns the provider user record for profile actions (M7).',
  },
  'app/auth/update-password/page.tsx': {
    calls: 1,
    reason: 'Reads session claims for the password flow (M7).',
  },
  'lib/supabase/middleware.ts': {
    calls: 1,
    reason: 'Session refresh in the proxy (M7, server-supabase).',
  },
};

const SRC = dirname(fileURLToPath(import.meta.url));
const DIRECT_CALL = /\bauth\s*\.\s*(?:getClaims|getUser)\s*\(/g;
const TEST_FILE = /\.(?:dom\.)?test\.tsx?$/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !TEST_FILE.test(entry.name)
      ? [path]
      : [];
  });
}

const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function directCalls(): Record<string, number> {
  const found: Record<string, number> = {};
  for (const file of sourceFiles(SRC)) {
    const count = withoutComments(readFileSync(file, 'utf8')).match(
      DIRECT_CALL,
    )?.length;
    if (count) found[relative(SRC, file).split('\\').join('/')] = count;
  }
  return found;
}

describe('identity boundary', () => {
  it('finds the source it scans', () => {
    expect(sourceFiles(SRC).length).toBeGreaterThan(100);
  });

  it('allows direct Supabase identity calls only where listed', () => {
    const allowed = Object.fromEntries(
      Object.entries(ALLOWED).map(([file, { calls }]) => [file, calls]),
    );

    expect(directCalls()).toEqual(allowed);
  });
});
