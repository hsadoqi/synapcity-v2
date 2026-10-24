import { describe, expect, it } from 'vitest';

import { columnsFor, resolveBreakpoint } from './index';

describe('columnsFor', () => {
  it('derives tablet and mobile columns from the desktop count', () => {
    expect(columnsFor(3, 'lg')).toBe(3);
    expect(columnsFor(3, 'md')).toBe(2);
    expect(columnsFor(3, 'sm')).toBe(1);
    expect(columnsFor(1, 'md')).toBe(1);
  });
});

describe('resolveBreakpoint', () => {
  it.each([
    [390, 'sm'],
    [639, 'sm'],
    [640, 'md'],
    [1023, 'md'],
    [1024, 'lg'],
  ] as const)('maps %ipx to %s', (width, bp) => {
    expect(resolveBreakpoint(width)).toBe(bp);
  });
});
