import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { EXCEPTIONS } from '../exceptions/index.ts';
import { APP_SERVER_ONLY } from '../rules/reachability/index.ts';
import { check, type CheckResult } from './index.ts';

const REPOSITORY = resolve(import.meta.dirname, '../../../../..');

describe('the repository', () => {
  let result: CheckResult;
  // The scan reads every workspace file, which outlasts the default hook timeout under parallel load.
  beforeAll(() => {
    result = check(REPOSITORY, EXCEPTIONS, APP_SERVER_ONLY);
  }, 60_000);

  it('has no boundary violations beyond the named exceptions', () => {
    expect(
      result.violations.map((v) => `${v.rule} ${v.file} -> ${v.specifier}`),
    ).toEqual([]);
  });

  it('has no stale exceptions', () => {
    expect(result.stale).toEqual([]);
  });

  it('finds source files in the main workspaces, so the scan cannot pass silently', () => {
    for (const name of [
      'web',
      '@synapcity/frontend-ui',
      '@synapcity/dev-fixtures',
    ]) {
      expect(result.fileCounts[name]).toBeGreaterThan(0);
    }
  });
});
