import { afterAll, describe, expect, it } from 'vitest';

import type { Violation } from '../../model/index.ts';
import { manifest, probe } from '../../testing/probe/index.ts';
import { cycleRule } from './index.ts';

const cleanups: Array<() => void> = [];
afterAll(() => cleanups.forEach((cleanup) => cleanup()));

function run(extra: Record<string, string> = {}): Violation[] {
  const { workspace, edges, cleanup } = probe(extra);
  cleanups.push(cleanup);
  return cycleRule(workspace, edges);
}

describe('cycleRule (R9)', () => {
  it('passes the clean workspace', () => {
    expect(run()).toEqual([]);
  });

  it('fails two packages that depend on each other, including through devDependencies, once', () => {
    const violations = run({
      'packages/frontend/p1/package.json': manifest('@t/frontend-p1', {
        dependencies: { '@t/frontend-p2': 'workspace:*' },
      }),
      'packages/frontend/p2/package.json': manifest('@t/frontend-p2', {
        devDependencies: { '@t/frontend-p1': 'workspace:*' },
      }),
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      rule: 'R9',
      file: 'packages/frontend/p1/package.json',
    });
    expect(violations[0]?.message).toContain('@t/frontend-p1');
    expect(violations[0]?.message).toContain('@t/frontend-p2');
  });

  it('fails a module cycle once, named by its alphabetically first member', () => {
    const violations = run({
      'packages/frontend/f/src/c1.ts': `import './c2.ts';`,
      'packages/frontend/f/src/c2.ts': `import './c3.ts';`,
      'packages/frontend/f/src/c3.ts': `import './c1.ts';`,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      rule: 'R9',
      file: 'packages/frontend/f/src/c1.ts',
    });
    for (const member of ['c1.ts', 'c2.ts', 'c3.ts'])
      expect(violations[0]?.message).toContain(member);
  });

  it('counts type-only edges in a module cycle', () => {
    expect(
      run({
        'packages/frontend/f/src/t1.ts': `import type { B } from './t2.ts';\nexport type A = B;`,
        'packages/frontend/f/src/t2.ts': `import type { A } from './t1.ts';\nexport type B = A;`,
      }).map((v) => v.file),
    ).toEqual(['packages/frontend/f/src/t1.ts']);
  });
});
