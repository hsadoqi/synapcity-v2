import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { check } from './index.ts';

const REPOSITORY = resolve(import.meta.dirname, '../../../../..');

describe('the repository', () => {
  const result = check(REPOSITORY);

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
