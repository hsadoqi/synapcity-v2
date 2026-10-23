import { afterAll, describe, expect, it } from 'vitest';

import type { Violation } from '../../model/index.ts';
import { createWorkspace } from '../../testing/workspace/index.ts';
import { loadWorkspace } from '../../workspace/index.ts';
import { buildEdges, edgeRules } from './index.ts';

const manifest = (name: string, extra: object = {}) =>
  JSON.stringify({ name, type: 'module', ...extra });

const BASE: Record<string, string> = {
  'packages/domain/d/package.json': manifest('@t/domain-d', {
    exports: { '.': './src/index.ts' },
  }),
  'packages/domain/d/src/index.ts': 'export const d = 1;',
  'packages/frontend/f/package.json': manifest('@t/frontend-f', {
    exports: { '.': './src/index.ts' },
  }),
  'packages/frontend/f/src/index.ts': `import { d } from '@t/domain-d';\nexport const f = d;`,
  'packages/frontend/f/src/next/link.tsx': `import Link from 'next/link';\nexport { Link };`,
  'packages/server/s/package.json': manifest('@t/server-s', {
    exports: { '.': './src/index.ts', './testing': './src/testing/index.ts' },
  }),
  'packages/server/s/src/index.ts': 'export const s = 1;',
  'packages/server/s/src/testing/index.ts': 'export const fake = 1;',
  'packages/features/feat/package.json': manifest('@t/features-feat'),
  'packages/features/feat/src/contracts/index.ts':
    'export type C = { id: string };',
  'packages/features/feat/src/frontend/index.ts': `import type { C } from '../contracts/index.ts';\nexport type F = C;`,
  'packages/features/feat/src/server/index.ts': `import { s } from '@t/server-s';\nexport const load = () => s;`,
  'packages/features/feat/src/testing/index.ts':
    'export const fakeLoad = () => 1;',
  'packages/features/feat/src/frontend/a/a.ts': 'export const a = 1;',
  'packages/features/feat/src/frontend/a/index.ts': `export { a } from './a.ts';`,
  'packages/dev/fx/package.json': manifest('@synapcity/dev-fx', {
    exports: { '.': './src/index.ts' },
  }),
  'packages/dev/fx/src/index.ts': 'export const fixture = 1;',
  'apps/web/package.json': manifest('web'),
  'apps/web/src/page.tsx': `import { f } from '@t/frontend-f';\nimport './styles.css';\nimport logo from './logo.svg';\nexport default function Page() { return f + String(logo); }`,
  'apps/web/src/styles.css': '',
  'apps/web/src/logo.svg': '<svg/>',
  'apps/web/vitest.config.ts': `import { fixture } from '@synapcity/dev-fx';\nexport default fixture;`,
  'apps/web/src/page.test.ts': `import { fixture } from '@synapcity/dev-fx';\nimport { fake } from '@t/server-s/testing';\nexport const t = fixture + fake;`,
  'apps/other/package.json': manifest('other'),
  'apps/other/src/x.ts': 'export const x = 1;',
  'node_modules/zod/package.json': manifest('zod', { main: 'index.js' }),
  'node_modules/zod/index.js': '',
  'node_modules/react/package.json': manifest('react', { main: 'index.js' }),
  'node_modules/react/index.js': '',
  'node_modules/next/package.json': manifest('next'),
  'node_modules/next/link.js': '',
};

const LINKS = {
  'node_modules/@t/domain-d': 'packages/domain/d',
  'node_modules/@t/frontend-f': 'packages/frontend/f',
  'node_modules/@t/server-s': 'packages/server/s',
  'node_modules/@t/features-feat': 'packages/features/feat',
  'node_modules/@synapcity/dev-fx': 'packages/dev/fx',
};

const cleanups: Array<() => void> = [];
afterAll(() => cleanups.forEach((cleanup) => cleanup()));

function run(extra: Record<string, string> = {}): Violation[] {
  const ws = createWorkspace({ ...BASE, ...extra }, LINKS);
  cleanups.push(ws.cleanup);
  const workspace = loadWorkspace(ws.root);
  const { files, edges } = buildEdges(workspace);
  return edgeRules(files, edges, workspace);
}

const summary = (violations: Violation[]) =>
  violations.map((v) => `${v.rule} ${v.file}`);

describe('edgeRules', () => {
  it('passes the clean workspace, including asset imports and allowed dev imports from tests and config', () => {
    expect(summary(run())).toEqual([]);
  });

  describe('R0', () => {
    it('fails an unresolved production import', () => {
      expect(
        summary(run({ 'apps/web/src/x.ts': `import './missing';` })),
      ).toEqual(['R0 apps/web/src/x.ts']);
    });
    it('fails an unresolved import in a test file too', () => {
      expect(
        summary(run({ 'apps/web/src/x.test.ts': `import './missing';` })),
      ).toEqual(['R0 apps/web/src/x.test.ts']);
    });
    it('fails a non-literal dynamic import in production', () => {
      expect(
        summary(
          run({
            'apps/web/src/x.ts': `export const load = (n: string) => import(n);`,
          }),
        ),
      ).toEqual(['R0 apps/web/src/x.ts']);
    });
    it('fails a file that does not parse', () => {
      expect(
        summary(run({ 'apps/web/src/x.ts': `import { from './broken'` })),
      ).toEqual(['R0 apps/web/src/x.ts']);
    });
  });

  it('R1: fails a package importing app source', () => {
    expect(
      summary(
        run({
          'packages/frontend/f/src/bad.ts': `import '../../../../apps/web/src/page.tsx';`,
        }),
      ),
    ).toEqual(['R1 packages/frontend/f/src/bad.ts']);
  });

  describe('R2', () => {
    it('fails frontend importing server', () => {
      expect(
        summary(
          run({
            'packages/frontend/f/src/bad.ts': `import { s } from '@t/server-s';\nexport { s };`,
          }),
        ),
      ).toEqual(['R2 packages/frontend/f/src/bad.ts']);
    });
    it('counts a type-only import against the matrix', () => {
      expect(
        summary(
          run({
            'packages/domain/d/src/bad.ts': `import type { f } from '@t/frontend-f';\nexport type F = typeof f;`,
          }),
        ),
      ).toEqual(['R2 packages/domain/d/src/bad.ts']);
    });
    it('fails an app importing another app', () => {
      expect(
        summary(
          run({ 'apps/web/src/bad.ts': `import '../../other/src/x.ts';` }),
        ),
      ).toEqual(['R2 apps/web/src/bad.ts']);
    });
  });

  describe('R4', () => {
    it('fails domain importing react or a Node built-in, and allows zod', () => {
      expect(
        summary(
          run({
            'packages/domain/d/src/ok.ts': `import 'zod';`,
            'packages/domain/d/src/react.ts': `import 'react';`,
            'packages/domain/d/src/fs.ts': `import 'node:fs';`,
          }),
        ),
      ).toEqual([
        'R4 packages/domain/d/src/fs.ts',
        'R4 packages/domain/d/src/react.ts',
      ]);
    });
  });

  describe('R5', () => {
    it('fails a relative import into another package', () => {
      expect(
        summary(
          run({
            'packages/frontend/f/src/bad.ts': `import '../../../domain/d/src/index.ts';`,
          }),
        ),
      ).toEqual(['R5 packages/frontend/f/src/bad.ts']);
    });
    it('allows a package importing itself by name', () => {
      expect(
        summary(
          run({
            'packages/frontend/f/package.json': manifest('@t/frontend-f', {
              exports: { '.': './src/index.ts' },
            }),
            'packages/frontend/f/src/self.ts': `import { f } from '@t/frontend-f';\nexport { f };`,
          }),
        ),
      ).toEqual([]);
    });
  });

  describe('R6', () => {
    it('fails feature frontend importing feature server', () => {
      expect(
        summary(
          run({
            'packages/features/feat/src/frontend/bad.ts': `import '../server/index.ts';`,
          }),
        ),
      ).toEqual(['R6 packages/features/feat/src/frontend/bad.ts']);
    });
    it('fails feature contracts importing feature frontend', () => {
      expect(
        summary(
          run({
            'packages/features/feat/src/contracts/bad.ts': `import '../frontend/index.ts';`,
          }),
        ),
      ).toEqual(['R6 packages/features/feat/src/contracts/bad.ts']);
    });
    it('fails feature production code importing its testing folder', () => {
      expect(
        summary(
          run({
            'packages/features/feat/src/frontend/bad.ts': `import '../testing/index.ts';`,
          }),
        ),
      ).toEqual(['R6 packages/features/feat/src/frontend/bad.ts']);
    });
    it('fails a feature source file outside the four entry folders', () => {
      expect(
        summary(
          run({
            'packages/features/feat/src/stray.ts': 'export const stray = 1;',
          }),
        ),
      ).toEqual(['R6 packages/features/feat/src/stray.ts']);
    });
  });

  describe('R7', () => {
    it('fails importing a file inside another folder in a new package, and allows the folder', () => {
      expect(
        summary(
          run({
            'packages/features/feat/src/frontend/bad.ts': `import { a } from './a/a.ts';\nexport { a };`,
            'packages/features/feat/src/frontend/ok.ts': `import { a } from './a';\nexport { a };`,
          }),
        ),
      ).toEqual(['R7 packages/features/feat/src/frontend/bad.ts']);
    });
    it('leaves legacy packages to their own structure rules', () => {
      expect(
        summary(
          run({
            'packages/frontend/ui/package.json': manifest(
              '@synapcity/frontend-ui',
            ),
            'packages/frontend/ui/src/a/a.ts': 'export const a = 1;',
            'packages/frontend/ui/src/b.ts': `import { a } from './a/a.ts';\nexport { a };`,
          }),
        ),
      ).toEqual([]);
    });
  });

  describe('R8', () => {
    it('fails production code importing a dev package, a testing entry or a test file', () => {
      expect(
        summary(
          run({
            'apps/web/src/fixture.ts': `import '@synapcity/dev-fx';`,
            'apps/web/src/fake.ts': `import '@t/server-s/testing';`,
            'apps/web/src/test-import.ts': `import './page.test.ts';`,
          }),
        ),
      ).toEqual([
        'R8 apps/web/src/fake.ts',
        'R8 apps/web/src/fixture.ts',
        'R8 apps/web/src/test-import.ts',
      ]);
    });
  });

  describe('R11', () => {
    it('fails next imports in a frontend package outside the next entry folder', () => {
      expect(
        summary(
          run({
            'packages/frontend/f/src/bad.tsx': `import Link from 'next/link';\nexport { Link };`,
          }),
        ),
      ).toEqual(['R11 packages/frontend/f/src/bad.tsx']);
    });
  });

  it('reports the import and its target', () => {
    const [violation] = run({
      'packages/frontend/f/src/bad.ts': `import { s } from '@t/server-s';\nexport { s };`,
    });
    expect(violation).toMatchObject({
      rule: 'R2',
      specifier: '@t/server-s',
      target: 'packages/server/s/src/index.ts',
    });
  });
});
