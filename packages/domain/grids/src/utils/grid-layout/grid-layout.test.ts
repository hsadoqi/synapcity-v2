import { describe, expect, it } from 'vitest';

import {
  COLLAPSED_ROWS,
  layoutsEqual,
  mergeLayoutChange,
  toGridLayout,
} from './index';

const stat = { w: 1, h: 3, minW: 1, minH: 2 };
const tasks = { w: 1, h: 5, minW: 1, minH: 3 };

describe('toGridLayout', () => {
  it('derives constraints, clamps to columns and appends missing items', () => {
    const grid = toGridLayout(
      [{ i: 'a', x: 2, y: 0, w: 3, h: 3 }],
      [
        { id: 'a', collapsed: false, size: stat },
        { id: 'b', collapsed: false, size: tasks },
      ],
      2,
    );
    expect(grid[0]).toMatchObject({ i: 'a', x: 0, w: 2, minH: 2, maxW: 2 });
    expect(grid[0]).not.toHaveProperty('isResizable');
    expect(grid[1]).toMatchObject({ i: 'b', x: 0, y: 3, h: 5 });
  });

  it('widens a stored item to its minimum width, within the columns', () => {
    const wide = { w: 2, h: 3, minW: 2, minH: 2 };
    const stored = [{ i: 'a', x: 2, y: 0, w: 1, h: 3 }];
    const item = [{ id: 'a', collapsed: false, size: wide }];
    expect(toGridLayout(stored, item, 3)[0]).toMatchObject({ x: 1, w: 2 });
    expect(toGridLayout(stored, item, 1)[0]).toMatchObject({ x: 0, w: 1 });
  });

  it('shrinks collapsed items without touching storage', () => {
    const stored = [{ i: 'a', x: 0, y: 0, w: 1, h: 5 }];
    const grid = toGridLayout(
      stored,
      [{ id: 'a', collapsed: true, size: tasks }],
      3,
    );
    expect(grid[0]).toMatchObject({ h: COLLAPSED_ROWS, isResizable: false });
    expect(stored[0]?.h).toBe(5);
  });

  it('marks a fixed item static and leaves the others free', () => {
    const grid = toGridLayout(
      [],
      [
        { id: 'a', collapsed: false, size: stat, fixed: true },
        { id: 'b', collapsed: false, size: stat },
      ],
      3,
    );
    expect(grid[0]).toMatchObject({ static: true });
    expect(grid[1]).not.toHaveProperty('static');
    expect(grid[1]).not.toHaveProperty('isResizable');
  });

  it('stops resizing an item that is not resizable', () => {
    const grid = toGridLayout(
      [],
      [{ id: 'a', collapsed: false, size: stat, resizable: false }],
      3,
    );
    expect(grid[0]).toMatchObject({ isResizable: false });
    expect(grid[0]).not.toHaveProperty('static');
  });
});

describe('mergeLayoutChange', () => {
  it('keeps the stored height of collapsed items', () => {
    const merged = mergeLayoutChange(
      [
        { i: 'a', x: 0, y: 0, w: 1, h: 5 },
        { i: 'b', x: 1, y: 0, w: 1, h: 3 },
      ],
      [
        { i: 'a', x: 1, y: 2, w: 1, h: COLLAPSED_ROWS },
        { i: 'b', x: 0, y: 0, w: 2, h: 4 },
      ],
      new Set(['a']),
    );
    expect(merged).toEqual([
      { i: 'a', x: 1, y: 2, w: 1, h: 5 },
      { i: 'b', x: 0, y: 0, w: 2, h: 4 },
    ]);
  });
});

describe('layoutsEqual', () => {
  const a = { i: 'a', x: 0, y: 0, w: 1, h: 3 };
  const b = { i: 'b', x: 1, y: 0, w: 1, h: 3 };

  it('ignores order and compares placement', () => {
    expect(layoutsEqual([a, b], [b, a])).toBe(true);
    expect(layoutsEqual([a, b], [a, { ...b, y: 1 }])).toBe(false);
    expect(layoutsEqual([a], [a, b])).toBe(false);
  });
});
