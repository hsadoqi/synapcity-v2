import type { GridItem } from '@synapcity/domain-grids';
import { describe, expect, it } from 'vitest';

import { keyboardDelta, nudgeLayoutItem } from './keyboard-move';

const item = (overrides: Partial<GridItem> = {}): GridItem => ({
  i: 'a',
  x: 2,
  y: 2,
  w: 3,
  h: 2,
  minW: 2,
  minH: 2,
  maxW: 6,
  ...overrides,
});

describe('keyboardDelta', () => {
  it('moves one grid unit per arrow key', () => {
    expect(keyboardDelta('ArrowLeft', false)).toEqual({
      dx: -1,
      dy: 0,
      dw: 0,
      dh: 0,
    });
    expect(keyboardDelta('ArrowDown', false)).toEqual({
      dx: 0,
      dy: 1,
      dw: 0,
      dh: 0,
    });
  });

  it('resizes with Shift held', () => {
    expect(keyboardDelta('ArrowRight', true)).toEqual({
      dx: 0,
      dy: 0,
      dw: 1,
      dh: 0,
    });
    expect(keyboardDelta('ArrowUp', true)).toEqual({
      dx: 0,
      dy: 0,
      dw: 0,
      dh: -1,
    });
  });

  it('ignores keys that are not arrows', () => {
    expect(keyboardDelta('a', false)).toBeNull();
    expect(keyboardDelta('Enter', true)).toBeNull();
  });
});

describe('nudgeLayoutItem', () => {
  it('moves only the named item', () => {
    const items = [item(), item({ i: 'b', x: 0, y: 0 })];
    const next = nudgeLayoutItem(
      items,
      'a',
      { dx: 1, dy: 0, dw: 0, dh: 0 },
      12,
    );
    expect(next.find((n) => n.i === 'a')).toMatchObject({ x: 3, y: 0 });
    expect(next.find((n) => n.i === 'b')).toEqual({
      i: 'b',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
    });
  });

  it('pushes a colliding item using the grid layout behavior', () => {
    const items = [
      item({ x: 0, y: 0, w: 2, h: 2 }),
      item({ i: 'b', x: 2, y: 0, w: 2, h: 2 }),
    ];
    const next = nudgeLayoutItem(items, 'a', { dx: 1, dy: 0, dw: 0, dh: 0 }, 6);

    expect(next).toMatchObject([
      { i: 'a', x: 1, y: 0, w: 2, h: 2 },
      { i: 'b', x: 2, y: 2, w: 2, h: 2 },
    ]);
  });

  it('keeps the item inside the grid on the right', () => {
    const next = nudgeLayoutItem(
      [item({ x: 9, w: 3 })],
      'a',
      { dx: 5, dy: 0, dw: 0, dh: 0 },
      12,
    );
    expect(next[0]).toMatchObject({ x: 9 });
  });

  it('does not move above the top or left of the grid', () => {
    const next = nudgeLayoutItem(
      [item({ x: 0, y: 0 })],
      'a',
      { dx: -1, dy: -1, dw: 0, dh: 0 },
      12,
    );
    expect(next[0]).toMatchObject({ x: 0, y: 0 });
  });

  it('keeps width within the minimum and maximum', () => {
    const shrink = nudgeLayoutItem(
      [item({ w: 2, minW: 2 })],
      'a',
      { dx: 0, dy: 0, dw: -1, dh: 0 },
      12,
    );
    expect(shrink[0]).toMatchObject({ w: 2 });

    const grow = nudgeLayoutItem(
      [item({ w: 6, maxW: 6 })],
      'a',
      { dx: 0, dy: 0, dw: 1, dh: 0 },
      12,
    );
    expect(grow[0]).toMatchObject({ w: 6 });
  });

  it('caps width at the column count', () => {
    const next = nudgeLayoutItem(
      [item({ w: 4, maxW: 12 })],
      'a',
      { dx: 0, dy: 0, dw: 20, dh: 0 },
      6,
    );
    expect(next[0]).toMatchObject({ w: 6, x: 0 });
  });

  it('keeps height at or above the minimum', () => {
    const next = nudgeLayoutItem(
      [item({ h: 2, minH: 2 })],
      'a',
      { dx: 0, dy: 0, dw: 0, dh: -5 },
      12,
    );
    expect(next[0]).toMatchObject({ h: 2 });
  });
});
