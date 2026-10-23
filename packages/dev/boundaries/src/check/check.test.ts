import { afterAll, describe, expect, it } from 'vitest';

import { BASE, LINKS, manifest } from '../testing/probe/index.ts';
import { createWorkspace } from '../testing/workspace/index.ts';
import { check } from './index.ts';

const cleanups: Array<() => void> = [];
afterAll(() => cleanups.forEach((cleanup) => cleanup()));

function root(extra: Record<string, string> = {}): string {
  const ws = createWorkspace({ ...BASE, ...extra }, LINKS);
  cleanups.push(ws.cleanup);
  return ws.root;
}

describe('check', () => {
  it('passes a clean workspace and counts every package', () => {
    const result = check(root(), []);
    expect(result.violations).toEqual([]);
    expect(result.stale).toEqual([]);
    for (const name of [
      '@t/domain-d',
      '@t/frontend-f',
      '@t/server-s',
      '@t/features-feat',
      'web',
      'other',
    ]) {
      expect(result.fileCounts[name]).toBeGreaterThan(0);
    }
  });

  it('returns exactly the violation a workspace contains', () => {
    const result = check(
      root({
        'apps/web/src/client.tsx': `'use client';\nimport { a } from './a.ts';\nexport const C = () => a;`,
        'apps/web/src/a.ts': `export { b as a } from './b.ts';`,
        'apps/web/src/b.ts': `import { headers } from 'next/headers';\nexport const b = headers;`,
        'node_modules/next/headers.js': '',
      }),
      [],
    );
    expect(result.violations.map((v) => `${v.rule} ${v.file}`)).toEqual([
      'R3 apps/web/src/client.tsx',
    ]);
  });

  it('applies exceptions and reports stale ones', () => {
    const result = check(root(), [
      { rule: 'R9', file: 'nothing.ts', reason: 'r', removal: 'M6' },
    ]);
    expect(result.stale).toHaveLength(1);
  });

  it('throws when a package with a src folder yields no source files', () => {
    expect(() =>
      check(
        root({
          'packages/frontend/empty/package.json': manifest('@t/frontend-empty'),
          'packages/frontend/empty/src/notes.md': '',
        }),
        [],
      ),
    ).toThrow('@t/frontend-empty');
  });
});
