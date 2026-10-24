import { afterAll, describe, expect, it } from 'vitest';

import type { Violation } from '../../model/index.ts';
import { probe } from '../../testing/probe/index.ts';
import { reachabilityRule } from './index.ts';

const cleanups: Array<() => void> = [];
afterAll(() => cleanups.forEach((cleanup) => cleanup()));

function run(extra: Record<string, string> = {}): Violation[] {
  const { files, edges, workspace, cleanup } = probe(extra);
  cleanups.push(cleanup);
  return reachabilityRule(files, edges, workspace);
}

const summary = (violations: Violation[]) =>
  violations.map((v) => `${v.rule} ${v.file} -> ${v.target}`);

describe('reachabilityRule (R3)', () => {
  it('passes the clean workspace', () => {
    expect(run()).toEqual([]);
  });

  it('fails a frontend module that reaches server code through a harmless module', () => {
    const violations = run({
      'packages/frontend/f/src/harmless.ts': `export { s } from '../../../server/s/src/index.ts';`,
      'packages/frontend/f/src/view.ts': `import { s } from './harmless.ts';\nexport const v = s;`,
    });
    expect(summary(violations)).toContain(
      'R3 packages/frontend/f/src/view.ts -> packages/server/s/src/index.ts',
    );
    expect(
      violations.find((v) => v.file === 'packages/frontend/f/src/view.ts')
        ?.message,
    ).toContain('packages/frontend/f/src/harmless.ts');
  });

  it('fails a client component that reaches next/headers through two app files', () => {
    expect(
      summary(
        run({
          'apps/web/src/client.tsx': `'use client';\nimport { a } from './a.ts';\nexport const C = () => a;`,
          'apps/web/src/a.ts': `export { b as a } from './b.ts';`,
          'apps/web/src/b.ts': `import { headers } from 'next/headers';\nexport const b = headers;`,
          'node_modules/next/headers.js': '',
        }),
      ),
    ).toContain('R3 apps/web/src/client.tsx -> next/headers');
  });

  it('stops at a use server action boundary', () => {
    expect(
      run({
        'apps/web/src/client.tsx': `'use client';\nimport { act } from './actions.ts';\nexport const C = () => act;`,
        'apps/web/src/actions.ts': `'use server';\nimport { s } from '@t/server-s';\nexport async function act() { return s; }`,
      }),
    ).toEqual([]);
  });

  it('ignores a chain made only of type imports, which are erased', () => {
    expect(
      run({
        'packages/frontend/f/src/view.ts': `import type { S } from './types.ts';\nexport type V = S;`,
        'packages/frontend/f/src/types.ts': `import type { s } from '@t/server-s';\nexport type S = typeof s;`,
      }),
    ).toEqual([]);
  });

  it('follows export star and named re-exports', () => {
    const violations = run({
      'packages/frontend/f/src/view.ts': `export * from './star.ts';`,
      'packages/frontend/f/src/star.ts': `export { s } from '@t/server-s';`,
    });
    expect(summary(violations)).toContain(
      'R3 packages/frontend/f/src/view.ts -> packages/server/s/src/index.ts',
    );
  });

  it('fails feature contracts that reach feature server code', () => {
    expect(
      summary(
        run({
          'packages/features/feat/src/contracts/bad.ts': `export { load } from '../server/index.ts';`,
        }),
      ),
    ).toContain(
      'R3 packages/features/feat/src/contracts/bad.ts -> packages/features/feat/src/server/index.ts',
    );
  });
});
