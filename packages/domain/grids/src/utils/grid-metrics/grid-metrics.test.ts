import { describe, expect, it } from 'vitest';

import { minGridWidth } from './index';

describe('minGridWidth', () => {
  it('keeps each column at its minimum plus gutters', () => {
    expect(minGridWidth(3)).toBe(3 * 120 + 2 * 16);
    expect(minGridWidth(1)).toBe(120);
  });
});
