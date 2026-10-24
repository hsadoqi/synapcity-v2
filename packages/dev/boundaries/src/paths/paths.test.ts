import { describe, expect, it } from 'vitest';

import type { Violation } from '../model/index.ts';
import { byFileThenRule, repoPath } from './index.ts';

const violation = (rule: Violation['rule'], file: string): Violation => ({
  rule,
  file,
  specifier: '',
  target: null,
  message: '',
});

describe('repoPath', () => {
  it('returns a root-relative path', () => {
    expect(repoPath('/repo', '/repo/apps/web/src/a.ts')).toBe(
      'apps/web/src/a.ts',
    );
  });
});

describe('byFileThenRule', () => {
  it('orders by file, then numerically by rule', () => {
    const sorted = [
      violation('R10', 'a.ts'),
      violation('R2', 'a.ts'),
      violation('R9', 'a.ts'),
      violation('R0', 'b.ts'),
      violation('R11', 'a.ts'),
    ].sort(byFileThenRule);
    expect(sorted.map((v) => `${v.file} ${v.rule}`)).toEqual([
      'a.ts R2',
      'a.ts R9',
      'a.ts R10',
      'a.ts R11',
      'b.ts R0',
    ]);
  });
});
