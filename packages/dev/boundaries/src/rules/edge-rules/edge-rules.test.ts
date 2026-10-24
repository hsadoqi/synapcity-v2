import { afterAll, describe, expect, it } from 'vitest';

import type { Violation } from '../../model/index.ts';
import { manifest, probe } from '../../testing/probe/index.ts';
import { edgeRules } from './index.ts';

const cleanups: Array<() => void> = [];
afterAll(() => cleanups.forEach((cleanup) => cleanup()));

function run(extra: Record<string, string> = {}): Violation[] {
  const { workspace, files, edges, cleanup } = probe(extra);
  cleanups.push(cleanup);
  return edgeRules(files, edges, workspace);
}

const summary = (violations: Violation[]) =>
  violations.map((v) => `${v.rule} ${v.file}`);

describe('edgeRules', () => {
  it('passes the clean workspace, including asset imports and allowed dev imports from tests and config', () => {
    expect(summary(run())).toEqual([]);
  });

  describe('R11 in features and the frontend-domain condition', () => {
    it('R11: fails a next import in feature frontend code outside frontend/next/', () => {
      expect(
        summary(
          run({
            'packages/features/feat/src/frontend/link.tsx': `import Link from 'next/link';\nexport { Link };`,
          }),
        ),
      ).toContain('R11 packages/features/feat/src/frontend/link.tsx');
    });
    it('R11: allows a next import under a feature frontend/next/ folder', () => {
      expect(
        summary(
          run({
            'packages/features/feat/src/frontend/next/index.ts': `import Link from 'next/link';\nexport { Link };`,
          }),
        ),
      ).toEqual([]);
    });
    it('R2: fails frontend importing a domain subpath other than contracts or rules', () => {
      expect(
        summary(
          run({
            'packages/domain/d/package.json': manifest('@t/domain-d', {
              exports: {
                '.': './src/index.ts',
                './contracts': './src/index.ts',
                './persistence': './src/persistence.ts',
              },
            }),
            'packages/domain/d/src/persistence.ts': 'export const p = 1;',
            'packages/frontend/f/src/x.ts': `import { p } from '@t/domain-d/persistence';\nexport const q = p;`,
          }),
        ),
      ).toEqual(['R2 packages/frontend/f/src/x.ts']);
    });
    it('R2: allows frontend importing a domain contracts entry', () => {
      expect(
        summary(
          run({
            'packages/domain/d/package.json': manifest('@t/domain-d', {
              exports: {
                '.': './src/index.ts',
                './contracts': './src/index.ts',
              },
            }),
            'packages/frontend/f/src/x.ts': `import { d } from '@t/domain-d/contracts';\nexport const q = d;`,
          }),
        ),
      ).toEqual([]);
    });
  });

  describe('R5 (unmatched deep specifier)', () => {
    it('reports a deep import no exports entry matches as R5, not R0', () => {
      expect(
        summary(
          run({
            'apps/web/src/x.ts': `import '@t/frontend-f/src/hidden';`,
          }),
        ),
      ).toEqual(['R5 apps/web/src/x.ts']);
    });
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

  describe('review fixes', () => {
    it("R0: fails an import that resolves to source the scan skips, such as another package's dist", () => {
      expect(
        summary(
          run({
            'packages/server/s/dist/index.js': 'export const s = 1;',
            'packages/frontend/f/src/bad.ts': `import '../../../server/s/dist/index.js';`,
          }),
        ),
      ).toEqual(['R0 packages/frontend/f/src/bad.ts']);
    });

    it('R0: names the unscanned file in the message', () => {
      const [violation] = run({
        'packages/server/s/dist/index.js': 'export const s = 1;',
        'packages/frontend/f/src/bad.ts': `import '../../../server/s/dist/index.js';`,
      });
      expect(violation?.message).toContain('did not visit');
      expect(violation?.message).toContain('packages/server/s/dist/index.js');
    });

    it('R2: applies the matrix to same-package feature edges (server never imports frontend)', () => {
      expect(
        summary(
          run({
            'packages/features/feat/src/server/bad.ts': `import '../frontend/index.ts';`,
          }),
        ),
      ).toEqual(['R2 packages/features/feat/src/server/bad.ts']);
    });

    it('R8: fails a feature production file importing its own test', () => {
      expect(
        summary(
          run({
            'packages/features/feat/src/frontend/x.test.ts': 'export {};',
            'packages/features/feat/src/frontend/bad.ts': `import './x.test.ts';`,
          }),
        ),
      ).toEqual(['R8 packages/features/feat/src/frontend/bad.ts']);
    });

    it('R0: fails a require() of a missing file and sees a require() edge', () => {
      expect(
        summary(
          run({
            'apps/web/src/x.ts': `const m = require('./missing');\nexport default m;`,
          }),
        ),
      ).toEqual(['R0 apps/web/src/x.ts']);
    });

    it('R8: fails a feature production file importing its own story', () => {
      expect(
        summary(
          run({
            'packages/features/feat/src/frontend/x.stories.tsx':
              'export default {};',
            'packages/features/feat/src/frontend/bad.ts': `import './x.stories.tsx';`,
          }),
        ),
      ).toEqual(['R8 packages/features/feat/src/frontend/bad.ts']);
    });

    it('R0: resolves type-only imports of declaration files and types-only packages', () => {
      expect(
        summary(
          run({
            'packages/frontend/f/src/types.d.ts': 'export type T = string;',
            'packages/frontend/f/src/uses-types.ts': `import type { T } from './types';\nexport type U = T;`,
            'node_modules/typesonly/package.json': manifest('typesonly', {
              types: 'index.d.ts',
            }),
            'node_modules/typesonly/index.d.ts': 'export type P = number;',
            'packages/frontend/f/src/uses-package-types.ts': `import type { P } from 'typesonly';\nexport type Q = P;`,
          }),
        ),
      ).toEqual([]);
    });
  });
});
