import { describe, expect, it } from 'vitest';

import type { Exception, Violation } from '../model/index.ts';
import { applyExceptions } from './index.ts';

const violation = (
  rule: Violation['rule'],
  file: string,
  specifier = 'x',
): Violation => ({
  rule,
  file,
  specifier,
  target: null,
  message: '',
});
const exception = (
  rule: Exception['rule'],
  file: string,
  specifier?: string,
): Exception => ({
  rule,
  file,
  ...(specifier ? { specifier } : {}),
  reason: 'r',
  removal: 'M6',
});

describe('applyExceptions', () => {
  it('removes a violation matched by rule and file', () => {
    const result = applyExceptions(
      [violation('R11', 'a.tsx'), violation('R2', 'b.ts')],
      [exception('R11', 'a.tsx')],
    );
    expect(result.remaining.map((v) => v.file)).toEqual(['b.ts']);
    expect(result.stale).toEqual([]);
  });

  it('matches the specifier when the exception names one', () => {
    const result = applyExceptions(
      [
        violation('R11', 'a.tsx', 'next/link'),
        violation('R11', 'a.tsx', 'next/navigation'),
      ],
      [exception('R11', 'a.tsx', 'next/link')],
    );
    expect(result.remaining.map((v) => v.specifier)).toEqual([
      'next/navigation',
    ]);
  });

  it('reports an exception that matches nothing as stale', () => {
    const stale = exception('R9', 'gone.ts');
    expect(applyExceptions([], [stale]).stale).toEqual([stale]);
  });

  it('matches an R9 exception only while the cycle keeps exactly its recorded members', () => {
    const grown: Violation = {
      ...violation('R9', 'a.ts', ''),
      members: ['a.ts', 'b.ts', 'z.ts'],
    };
    const recorded: Exception = {
      ...exception('R9', 'a.ts'),
      members: ['a.ts', 'b.ts'],
    };
    const result = applyExceptions([grown], [recorded]);
    expect(result.remaining).toEqual([grown]);
    expect(result.stale).toEqual([recorded]);
    const same: Violation = {
      ...violation('R9', 'a.ts', ''),
      members: ['a.ts', 'b.ts'],
    };
    expect(applyExceptions([same], [recorded]).remaining).toEqual([]);
  });
});
