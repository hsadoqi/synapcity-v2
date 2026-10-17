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
/**
 * A string literal right after `from` (named, default, namespace and type
 * imports; `export … from`), right after `import` (side-effect imports) or
 * inside `import(` (dynamic imports).
 *
 * This is a lexical scan, not a parse. It errs towards reporting too much: an
 * import-shaped string inside a comment or a template literal is treated as an
 * import, which fails the check loudly rather than letting an import through.
 * It checks direct imports only; a client module that imports a harmless
 * module which in turn imports a server-only one is not followed.
 */
const IMPORT = /(?:\bfrom|\bimport)\s*(?:\(\s*)?(['"])([^'"\n]+)\1/g;

/** Every module specifier the source imports or re-exports. */
function importSpecifiers(text: string): string[] {
  return Array.from(text.matchAll(IMPORT), (match) => match[2]!);
}

/**
 * Whether `'use client'` is in the module's directive prologue: the string
 * statements at the very top, which may be preceded by whitespace and comments
 * and may include other directives such as `'use strict'`.
 */
function isClientModule(text: string): boolean {
  /** One leading piece of the prologue: whitespace, a comment, or a directive. */
  const PIECE =
    /^(?:\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|(['"])([^'"\n]*)\1[ \t]*;?)/;

  let rest = text;
  for (;;) {
    const match = PIECE.exec(rest);
    if (!match) return false;
    if (match[2] === 'use client') return true;
    rest = rest.slice(match[0].length);
  }
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const posix = (path: string) => path.split('\\').join('/');
/**
 * The module a path names: without a source or ESM output extension (a `.js`
 * specifier resolves to the `.ts` file) and without a trailing `/index`.
 */
const stripExt = (path: string) =>
  path.replace(/\.(?:[cm]?[jt]sx?)$/, '').replace(/\/index$/, '');

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
      if (rule.clientOnly && !isClientModule(text)) continue;

      for (const spec of importSpecifiers(text)) {
        const resolved = stripExt(target(spec, rel));
        if (rule.forbid.some((pattern) => pattern.test(resolved))) {
          violations.push(`${rel} imports ${spec}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

/**
 * The scanner itself. Each case is a way of importing a server-only module
 * that a regex scan has missed before, so a check that passes above is known
 * to be looking at these forms too.
 */
describe('import scanner', () => {
  const OPERATIONS = 'features/auth/server/operations';
  const FROM = 'features/auth/components/form.tsx';
  const resolvedImports = (text: string) =>
    importSpecifiers(text).map((spec) => stripExt(target(spec, FROM)));

  it.each([
    ['a named import', `import { a } from '@/${OPERATIONS}';`],
    ['a side-effect import', `import '@/${OPERATIONS}';`],
    ['a `.js` specifier', `import { a } from '@/${OPERATIONS}.js';`],
    ['a relative path', `import { a } from '../server/operations';`],
    ['a re-export', `export * from '@/${OPERATIONS}';`],
    ['a dynamic import', `await import('@/${OPERATIONS}');`],
    ['a multi-line import', `import {\n  a,\n  b,\n} from '@/${OPERATIONS}';`],
    ['an `index` path', `import { a } from '@/${OPERATIONS}/index';`],
  ])('resolves %s', (_form, text) => {
    expect(resolvedImports(text)).toEqual([OPERATIONS]);
  });

  it.each([
    ['at the top', `'use client';\nimport x from 'y';`],
    ['in single quotes', `'use client'\n`],
    ['in double quotes', `"use client"\n`],
    ['after a line comment', `// Shows the form.\n'use client';\n`],
    ['after a block comment', `/**\n * Shows the form.\n */\n'use client';\n`],
    ['after another directive', `'use strict';\n'use client';\n`],
  ])('finds `use client` %s', (_where, text) => {
    expect(isClientModule(text)).toBe(true);
  });

  it.each([
    ['after code', `import x from 'y';\n'use client';\n`],
    ['inside a comment', `// 'use client'\nimport x from 'y';\n`],
    ['as the server directive', `'use server';\n`],
  ])('does not find `use client` %s', (_where, text) => {
    expect(isClientModule(text)).toBe(false);
  });
});
