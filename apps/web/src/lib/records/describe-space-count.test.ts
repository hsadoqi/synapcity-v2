import { describe, expect, it } from 'vitest';

import { describeSpaceCount } from './describe-space-count';

describe('describeSpaceCount', () => {
  it.each([
    [0, 'Not in a space'],
    [1, 'In 1 space'],
    [3, 'In 3 spaces'],
  ])('describes %i spaces', (count, expected) => {
    expect(describeSpaceCount(count)).toBe(expected);
  });
});
