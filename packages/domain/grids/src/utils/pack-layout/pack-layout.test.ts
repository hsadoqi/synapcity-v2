import { describe, expect, it } from 'vitest';

import { packLayout } from './index';

describe('packLayout', () => {
  it('wraps to a new row at the column limit using the tallest item', () => {
    const out = packLayout(
      [
        { id: 'a', w: 1, h: 3 },
        { id: 'b', w: 1, h: 5 },
        { id: 'c', w: 1, h: 3 },
        { id: 'd', w: 1, h: 4 },
      ],
      3,
    );
    expect(out.map(({ i, x, y }) => [i, x, y])).toEqual([
      ['a', 0, 0],
      ['b', 1, 0],
      ['c', 2, 0],
      ['d', 0, 5],
    ]);
  });

  it('clamps widths wider than the grid', () => {
    expect(packLayout([{ id: 'a', w: 4, h: 2 }], 2)[0]?.w).toBe(2);
  });
});
