import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Import boundaries for `features/*` and `components/forms` (ADR-0007, the
 * selected layout: app-local `features/<name>/{shared,server,client,components}`).
 *
 * This is a test and not an ESLint rule on purpose: ESLint does not currently
 * lint TypeScript in this app at all (the shared config has no `files` entry
 * for `.ts`/`.tsx`), and the rule would only warn under `eslint-plugin-only-warn`.
 * A failing test is the one enforcement that CI actually applies today.
 *
 * Layers: `shared` is the lowest, framework-free layer; `server` may use
 * `shared`; `client` and `components` may use `shared` and call `server`
 * through Server Actions. Server-only modules are the ones that need a request
 * (cookies, headers, the server Supabase client, the owner guard).
 */

const SRC = join(dirname(fileURLToPath(import.meta.url)));

/** Modules that only work on the server; a `'use client'` module cannot import them. */
const SERVER_ONLY = [
  /^lib\/supabase\/server$/,
  /^lib\/supabase\/middleware$/,
  /^next\/headers$/,
  /^features\/[^/]+\/server\/(session|site-origin|form-data|operations)$/,
  /^lib\/access\/.+/,
];

type Rule = {
  name: string;
  /** Which importing files the rule applies to (path relative to `src`). */
  from: RegExp;
  /** What they may not import: a src-relative path without extension, or a bare specifier. */
  forbid: RegExp[];
  /** Only for modules that start with the `'use client'` directive. */
  clientOnly?: boolean;
};

const FEATURE_SERVER = /^features\/[^/]+\/server\//;
const FEATURE_CLIENT = /^features\/[^/]+\/client\//;
const FEATURE_COMPONENTS = /^features\/[^/]+\/components\//;

const RULES: Rule[] = [
  {
    name: '`shared` is framework-free and server-free',
    from: /^features\/[^/]+\/shared\//,
    forbid: [
      /^next(\/.*)?$/,
      /^react-dom(\/.*)?$/,
      ...SERVER_ONLY,
      FEATURE_SERVER,
      FEATURE_CLIENT,
      FEATURE_COMPONENTS,
    ],
  },
  {
    name: '`server` does not depend on client hooks or components',
    from: /^features\/[^/]+\/server\//,
    forbid: [FEATURE_CLIENT, FEATURE_COMPONENTS],
  },
  {
    name: 'a `use client` module never imports a server-only module',
    from: /^(features|components)\//,
    forbid: SERVER_ONLY,
    clientOnly: true,
  },
  {
    name: 'auth uses account only through `shared`',
    from: /^features\/auth\//,
    forbid: [
      /^features\/account\/server\//,
      /^features\/account\/client\//,
      /^features\/account\/components\//,
    ],
  },
  {
    name: 'account uses auth only through `shared` (provider error mapping)',
    from: /^features\/account\//,
    forbid: [
      /^features\/auth\/server\//,
      /^features\/auth\/client\//,
      /^features\/auth\/components\//,
    ],
  },
  {
    name: 'common form presentation does not depend on a feature',
    from: /^components\/forms\//,
    forbid: [/^features\//],
  },
];

const SOURCE = /\.(ts|tsx)$/;
const TEST = /\.(test|stories)\.(ts|tsx)$/;
const IMPORT = /(?:\bfrom\s+|\bimport\(\s*)(['"])([^'"]+)\1/g;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const posix = (path: string) => path.split('\\').join('/');
const stripExt = (path: string) => path.replace(/\.(ts|tsx)$/, '');

/** A specifier as a src-relative path without extension, or the bare specifier. */
function target(spec: string, fromRel: string): string {
  if (spec.startsWith('@/')) return spec.slice(2);
  if (spec.startsWith('.')) {
    return posix(normalize(join(dirname(fromRel), spec)));
  }
  return spec;
}

const files = walk(SRC)
  .map((path) => ({ path, rel: posix(relative(SRC, path)) }))
  .filter(({ rel }) => SOURCE.test(rel) && !TEST.test(rel));

describe('import boundaries', () => {
  it('finds the modules it is meant to protect', () => {
    // A guard against the test passing because it scanned nothing.
    expect(
      files.filter(({ rel }) => rel.startsWith('features/')).length,
    ).toBeGreaterThan(20);
    expect(files.some(({ rel }) => rel.startsWith('components/forms/'))).toBe(
      true,
    );
  });

  it.each(RULES)('$name', (rule) => {
    const violations: string[] = [];

    for (const { path, rel } of files) {
      if (!rule.from.test(rel)) continue;
      const text = readFileSync(path, 'utf8');
      if (rule.clientOnly && !/^\s*(['"])use client\1/.test(text)) continue;

      for (const match of text.matchAll(IMPORT)) {
        const spec = match[2]!;
        const resolved = stripExt(target(spec, rel));
        if (rule.forbid.some((pattern) => pattern.test(resolved))) {
          violations.push(`${rel} imports ${spec}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
