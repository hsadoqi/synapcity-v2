import { describe, expect, it } from 'vitest';

import { goalPercent } from './index';

describe('goalPercent', () => {
  it('rounds and caps', () => {
    expect(goalPercent({ current: 14, target: 24 })).toBe(58);
    expect(goalPercent({ current: 30, target: 24 })).toBe(100);
    expect(goalPercent({ current: 1, target: 0 })).toBe(0);
  });

  it('never goes below zero', () => {
    expect(goalPercent({ current: -5, target: 10 })).toBe(0);
  });
});
