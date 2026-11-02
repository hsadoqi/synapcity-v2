import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

/**
 * Import boundaries for `features/*` (ADR-0007, the
 * selected layout: app-local `features/<name>/{shared,server,client,components}`).
 *
 * This is a test rather than an ESLint rule because a failing test is the one
 * enforcement that CI applies without extra configuration, and it can read the
 * `'use client'` and `'use server'` directives and the folder layout together.
 *
 * Layers: `shared` is the lowest, framework-free layer; `server` may use
 * `shared`; `client` and `components` may use `shared` and call `server`
 * through Server Actions. A module in a `server` folder is callable from the
 * browser only if it starts with the `'use server'` directive (an action entry
 * point); every other module there is ordinary server code. Request APIs, the
 * server and middleware Supabase clients and the owner guard are server-only.
 *
 * Limits, so this is not read as more than it is:
 * - It checks direct imports only. A client module that imports a harmless
 *   module which in turn imports a server-only one is not followed, so this is
 *   not proof that no server code reaches the browser bundle.
 * - It is a lexical scan, not a parse. It understands `import … from`,
 *   side-effect imports, `export … from` and literal `import('…')`, with
 *   comments stripped first. A regular expression literal that contains a quote
 *   character can confuse the comment stripper; the repository has none in the
 *   scanned source, and the "finds the modules" guards below fail if a scan
 *   goes silent.
 * - `require()` and a dynamic import whose argument is not a string literal are
 *   not resolved. The latter is rejected in protected layers outright.
 */

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Server-only no matter where they live: request APIs, server clients, the owner guard. */
const ALWAYS_SERVER_ONLY = [
  /^lib\/supabase\/server$/,
  /^lib\/supabase\/middleware$/,
  /^next\/headers$/,
  /^lib\/access\/.+/,
];

const FEATURE_SERVER = /^features\/[^/]+\/server\//;
const FEATURE_CLIENT = /^features\/[^/]+\/client\//;
const FEATURE_COMPONENTS = /^features\/[^/]+\/components\//;

type Forbid = RegExp | ((resolved: string) => boolean);

type Rule = {
  name: string;
  /** Which importing files the rule applies to (path relative to `src`). */
  from: RegExp;
  /** What they may not import: a src-relative path without extension, or a bare specifier. */
  forbid: Forbid[];
  /** Only for modules that start with the `'use client'` directive. */
  clientOnly?: boolean;
  /** Also reject `import(expression)`, whose target cannot be resolved here. */
  rejectUnresolvableDynamicImports?: boolean;
};

const matches = (forbid: Forbid, resolved: string) =>
  typeof forbid === 'function' ? forbid(resolved) : forbid.test(resolved);

/** Modules under a feature's `server` folder that are not Server Action entry points. */
type SourceFile = { path: string; rel: string };

function ordinaryServerModules(
  files: SourceFile[],
  read: (file: SourceFile) => string,
): Set<string> {
  const modules = new Set<string>();
  for (const file of files) {
    if (!FEATURE_SERVER.test(file.rel)) continue;
    if (hasDirective(read(file), 'use server')) continue;
    modules.add(stripExt(file.rel));
  }
  return modules;
}

function buildRules(serverModules: Set<string>): Rule[] {
  const serverOnly: Forbid[] = [
    ...ALWAYS_SERVER_ONLY,
    (resolved) => serverModules.has(resolved),
  ];

  return [
    {
      name: '`shared` is framework-free, provider-free and server-free',
      from: /^features\/[^/]+\/shared\//,
      forbid: [
        /^next(\/.*)?$/,
        /^react-dom(\/.*)?$/,
        // Runtime provider clients and the environment reader behind them.
        /^@supabase\//,
        /^lib\/supabase\/.+/,
        ...serverOnly,
        FEATURE_SERVER,
        FEATURE_CLIENT,
        FEATURE_COMPONENTS,
      ],
      rejectUnresolvableDynamicImports: true,
    },
    {
      name: '`server` does not depend on client hooks or components',
      from: FEATURE_SERVER,
      forbid: [FEATURE_CLIENT, FEATURE_COMPONENTS],
    },
    {
      name: 'a `use client` module never imports a server-only module',
      from: /./,
      forbid: serverOnly,
      clientOnly: true,
      rejectUnresolvableDynamicImports: true,
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
  ];
}

const SOURCE = /\.(ts|tsx)$/;
const TEST = /\.(test|stories)\.(ts|tsx)$/;

/**
 * Replaces comments with spaces (newlines kept) so that a comment between
 * `from` and the specifier, or around an import, cannot hide it, and a
 * commented-out import is not reported. String and template literals are
 * skipped so `'//'` is not read as a comment; a quoted string ends at its line
 * end, so one stray quote cannot swallow the rest of the file.
 */
function stripComments(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    const next = text[i + 1];
    if (ch === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') {
        out += ' ';
        i++;
      }
    } else if (ch === '/' && next === '*') {
      out += '  ';
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
        out += text[i] === '\n' ? '\n' : ' ';
        i++;
      }
      out += '  ';
      i += 2;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      out += ch;
      i++;
      while (i < text.length && text[i] !== ch) {
        if (text[i] === '\\') {
          out += text[i]! + (text[i + 1] ?? '');
          i += 2;
          continue;
        }
        if (ch !== '`' && text[i] === '\n') break;
        out += text[i];
        i++;
      }
      if (text[i] === ch) {
        out += ch;
        i++;
      }
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

/**
 * A string literal right after `from` (named, default, namespace and type
 * imports; `export … from`), right after `import` (side-effect imports) or
 * inside `import(` (dynamic imports). Run on text with comments stripped.
 */
const IMPORT = /(?:\bfrom|\bimport)\s*(?:\(\s*)?(['"])([^'"\n]+)\1/g;
/** `import(` followed by anything but a string literal. */
const UNRESOLVABLE_DYNAMIC_IMPORT = /\bimport\s*\(\s*(?!['"\s])/g;

/** Every module specifier the source imports or re-exports. */
function importSpecifiers(text: string): string[] {
  return Array.from(stripComments(text).matchAll(IMPORT), (match) => match[2]!);
}

function hasUnresolvableDynamicImport(text: string): boolean {
  return new RegExp(UNRESOLVABLE_DYNAMIC_IMPORT).test(stripComments(text));
}

/**
 * Whether the directive is in the module's directive prologue: the string
 * statements at the very top, which may be preceded by whitespace and comments
 * and may include other directives such as `'use strict'`.
 */
function hasDirective(text: string, directive: string): boolean {
  /** One leading piece of the prologue: whitespace, a comment, or a directive. */
  const PIECE =
    /^(?:\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|(['"])([^'"\n]*)\1[ \t]*;?)/;

  let rest = text;
  for (;;) {
    const match = PIECE.exec(rest);
    if (!match) return false;
    if (match[2] === directive) return true;
    rest = rest.slice(match[0].length);
  }
}

const isClientModule = (text: string) => hasDirective(text, 'use client');

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

function sourceFiles(root: string): SourceFile[] {
  return walk(root)
    .map((path) => ({ path, rel: posix(relative(root, path)) }))
    .filter(({ rel }) => SOURCE.test(rel) && !TEST.test(rel));
}

const readFile = (file: SourceFile) => readFileSync(file.path, 'utf8');

/** Every broken rule in `files`, one line each naming importer, target and rule. */
function findViolations(files: SourceFile[]): string[] {
  const rules = buildRules(ordinaryServerModules(files, readFile));
  const violations: string[] = [];

  for (const file of files) {
    const text = readFile(file);
    const client = isClientModule(text);

    for (const rule of rules) {
      if (!rule.from.test(file.rel)) continue;
      if (rule.clientOnly && !client) continue;

      for (const spec of importSpecifiers(text)) {
        const resolved = stripExt(target(spec, file.rel));
        if (rule.forbid.some((forbid) => matches(forbid, resolved))) {
          violations.push(
            `${file.rel} imports ${spec} (resolves to ${resolved}): ${rule.name}`,
          );
        }
      }

      if (
        rule.rejectUnresolvableDynamicImports &&
        hasUnresolvableDynamicImport(text)
      ) {
        violations.push(
          `${file.rel} has a dynamic import whose target cannot be resolved: ${rule.name}`,
        );
      }
    }
  }

  return violations;
}

const files = sourceFiles(SRC);

describe('import boundaries', () => {
  it('finds the modules it is meant to protect', () => {
    // A guard against the test passing because it scanned nothing.
    expect(
      files.filter(({ rel }) => rel.startsWith('features/')).length,
    ).toBeGreaterThan(20);
    expect(files.some(({ rel }) => FEATURE_SERVER.test(rel))).toBe(true);
    expect(
      files.some(({ rel }) =>
        isClientModule(readFile({ path: join(SRC, rel), rel })),
      ),
    ).toBe(true);
  });

  it('finds no broken rule in the source tree', () => {
    expect(findViolations(files)).toEqual([]);
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

/**
 * The review's four misses, plus the legal imports that must stay legal, run
 * through the same `findViolations` the source scan uses, on a throwaway tree.
 */
describe('import checks on a fixture tree', () => {
  const roots: string[] = [];
  afterAll(() => {
    for (const root of roots) rmSync(root, { recursive: true, force: true });
  });

  /** Writes `{ 'features/auth/shared/x.ts': 'source' }` to a temp tree and checks it. */
  function check(tree: Record<string, string>): string[] {
    const root = mkdtempSync(join(tmpdir(), 'import-boundaries-'));
    roots.push(root);
    for (const [rel, text] of Object.entries(tree)) {
      const path = join(root, rel);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, text);
    }
    return findViolations(sourceFiles(root));
  }

  const ACTIONS = { 'features/auth/server/actions.ts': `'use server';\n` };
  const HELPER = { 'features/auth/server/helper.ts': `export const h = 1;\n` };

  describe('catches', () => {
    it('an import hidden behind a comment', () => {
      const violations = check({
        ...HELPER,
        'features/auth/components/a.tsx': `'use client';\nimport { h } from /* why */ '@/features/auth/server/helper';\n`,
        'features/auth/components/b.tsx': `'use client';\nimport {\n  h, // keep\n} from // pick\n  '../server/helper';\n`,
      });
      expect(violations).toHaveLength(2);
      expect(violations.join('\n')).toMatch(/components\/a\.tsx imports/);
      expect(violations.join('\n')).toMatch(/components\/b\.tsx imports/);
    });

    it('an ordinary server helper that no list names', () => {
      const [violation, ...rest] = check({
        ...HELPER,
        'features/auth/components/a.tsx': `'use client';\nimport { h } from '@/features/auth/server/helper';\n`,
      });
      expect(rest).toEqual([]);
      expect(violation).toBe(
        'features/auth/components/a.tsx imports @/features/auth/server/helper (resolves to features/auth/server/helper): a `use client` module never imports a server-only module',
      );
    });

    it('a client module outside features and components', () => {
      const violations = check({
        'app/auth/widget.tsx': `'use client';\nimport { cookies } from 'next/headers';\n`,
      });
      expect(violations).toHaveLength(1);
      expect(violations[0]).toMatch(
        /^app\/auth\/widget\.tsx imports next\/headers/,
      );
    });

    it.each([
      [
        'the browser client',
        `import { createClient } from '@/lib/supabase/client';`,
      ],
      ['the environment reader', `import { env } from '@/lib/supabase/env';`],
      [
        'the provider SDK',
        `import { createBrowserClient } from '@supabase/ssr';`,
      ],
      ['a request API', `import { cookies } from 'next/headers';`],
      ['an ordinary server module', `import { h } from '../server/helper';`],
    ])('a shared module importing %s', (_what, line) => {
      const violations = check({
        ...HELPER,
        'features/auth/shared/leak.ts': `${line}\n`,
      });
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.join('\n')).toMatch(
        /^features\/auth\/shared\/leak\.ts imports .*`shared` is framework-free/m,
      );
    });

    it('a dynamic import it cannot resolve, in shared and client modules', () => {
      const violations = check({
        'features/auth/shared/a.ts': `export const load = (name: string) => import(name);\n`,
        'features/auth/components/b.tsx': `'use client';\nexport const load = (name: string) => import(\`./\${name}\`);\n`,
      });
      expect(violations).toHaveLength(2);
      expect(violations.join('\n')).toMatch(/cannot be resolved/);
    });
  });

  describe('allows', () => {
    it('the legal imports of each layer', () => {
      expect(
        check({
          ...ACTIONS,
          ...HELPER,
          'features/auth/shared/form-state.ts': `export type S = string;\n`,
          'features/auth/shared/view.tsx': `import type { S } from './form-state';\nimport { useId } from 'react';\n`,
          'features/auth/server/uses-shared.ts': `import type { S } from '../shared/form-state';\nimport { h } from './helper';\n`,
          // A client module may call a Server Action entry point.
          'features/auth/components/form.tsx': `'use client';\nimport { signOut } from '@/features/auth/server/actions/actions';\nimport type { S } from '../shared/form-state';\nconst load = () => import('../shared/form-state');\n`,
          'features/auth/client/hook.ts': `'use client';\nimport type { S } from '../shared/form-state';\n`,
        }),
      ).toEqual([]);
    });

    it('server-only imports in a module that is not a client module', () => {
      expect(
        check({
          ...HELPER,
          'app/page.tsx': `import { cookies } from 'next/headers';\nimport { h } from '@/features/auth/server/helper';\n`,
        }),
      ).toEqual([]);
    });

    it('a commented-out forbidden import and one-line strings that look like comments', () => {
      expect(
        check({
          ...HELPER,
          'features/auth/components/a.tsx': `'use client';\n// import { h } from '@/features/auth/server/helper';\n/* import { h } from '../server/helper'; */\nexport const url = 'https://example.test//path';\n`,
        }),
      ).toEqual([]);
    });
  });

  it('fails the check for a real forbidden source file (integrated)', () => {
    const violations = check({
      'features/auth/shared/ok.ts': `export const ok = 1;\n`,
      'features/auth/shared/leak.ts': `import { createClient } from '@/lib/supabase/client';\nexport { createClient };\n`,
    });
    expect(violations).toEqual([
      'features/auth/shared/leak.ts imports @/lib/supabase/client (resolves to lib/supabase/client): `shared` is framework-free, provider-free and server-free',
    ]);
  });
});
