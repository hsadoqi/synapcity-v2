import { afterAll, describe, expect, it } from 'vitest';

import type { Violation } from '../../model/index.ts';
import { probe } from '../../testing/probe/index.ts';
import { serverGuardRule } from './index.ts';

const cleanups: Array<() => void> = [];
afterAll(() => cleanups.forEach((cleanup) => cleanup()));

function run(extra: Record<string, string> = {}): Violation[] {
  const { workspace, files, cleanup } = probe(extra);
  cleanups.push(cleanup);
  return serverGuardRule(files, workspace);
}

const summary = (violations: Violation[]) =>
  violations.map((v) => `${v.rule} ${v.file}`);

describe('serverGuardRule (R10)', () => {
  it('passes guarded server and feature server entries', () => {
    expect(run()).toEqual([]);
  });

  it('fails a server package entry without the guard', () => {
    expect(
      summary(run({ 'packages/server/s/src/index.ts': 'export const s = 1;' })),
    ).toEqual(['R10 packages/server/s/src/index.ts']);
  });

  it('fails a guard that is not the first import', () => {
    expect(
      summary(
        run({
          'packages/server/s/src/index.ts': `import 'zod';\nimport 'server-only';\nexport const s = 1;`,
        }),
      ),
    ).toEqual(['R10 packages/server/s/src/index.ts']);
  });

  it('fails a guard that follows other code', () => {
    expect(
      summary(
        run({
          'packages/server/s/src/index.ts': `export const s = 1;\nimport 'server-only';`,
        }),
      ),
    ).toEqual(['R10 packages/server/s/src/index.ts']);
  });

  it('fails a feature server entry without the guard', () => {
    expect(
      summary(
        run({
          'packages/features/feat/src/server/index.ts': `import { s } from '@t/server-s';\nexport const load = () => s;`,
        }),
      ),
    ).toEqual(['R10 packages/features/feat/src/server/index.ts']);
  });

  it('fails a non-entry file importing the guard', () => {
    expect(
      summary(
        run({ 'packages/server/s/src/other.ts': `import 'server-only';` }),
      ),
    ).toEqual(['R10 packages/server/s/src/other.ts']);
  });

  it('allows app server modules to import the guard (Next.js hardening)', () => {
    expect(
      run({
        'apps/web/src/lib/server-thing.ts': `import 'server-only';\nexport const x = 1;`,
      }),
    ).toEqual([]);
  });
});
