import { describe, expect, it } from 'vitest';

import { flowLayout, mergeLayout, nudge, stackLayout } from './layout';

describe('flowLayout', () => {
  it('wraps when a row is full', () => {
    const layout = flowLayout(['Tasks', 'Schedule', 'Health']);
    expect(layout.map((i) => [i.i, i.x, i.y])).toEqual([
      ['Tasks', 0, 0],
      ['Schedule', 6, 0],
      ['Health', 0, 5],
    ]);
  });
});

describe('mergeLayout', () => {
  it('keeps saved positions, drops missing widgets and appends new ones below', () => {
    const saved = [
      { i: 'Tasks', x: 6, y: 0, w: 6, h: 6 },
      { i: 'Gone', x: 0, y: 0, w: 4, h: 4 },
    ];
    const merged = mergeLayout(saved, ['Tasks', 'Money']);
    expect(merged.find((i) => i.i === 'Tasks')).toMatchObject({ x: 6, y: 0 });
    expect(merged.some((i) => i.i === 'Gone')).toBe(false);
    expect(merged.find((i) => i.i === 'Money')?.y).toBe(6);
  });
});

describe('stackLayout', () => {
  it('orders by position and puts everything in one column', () => {
    const stacked = stackLayout([
      { i: 'b', x: 6, y: 0, w: 6, h: 4 },
      { i: 'a', x: 0, y: 0, w: 6, h: 4 },
      { i: 'c', x: 0, y: 4, w: 6, h: 4 },
    ]);
    expect(stacked.map((i) => i.i)).toEqual(['a', 'b', 'c']);
    expect(stacked.every((i) => i.x === 0 && i.w === 1)).toBe(true);
  });
});

describe('nudge', () => {
  const layout = [{ i: 'a', x: 0, y: 0, w: 6, h: 4 }];

  it('moves within the grid', () => {
    expect(nudge(layout, 'a', 'ArrowLeft', false)[0]?.x).toBe(0);
    expect(nudge(layout, 'a', 'ArrowRight', false)[0]?.x).toBe(1);
    expect(nudge(layout, 'a', 'ArrowUp', false)[0]?.y).toBe(0);
    expect(nudge(layout, 'a', 'ArrowDown', false)[0]?.y).toBe(1);
  });

  it('stops at the right edge', () => {
    const edge = [{ i: 'a', x: 6, y: 0, w: 6, h: 4 }];
    expect(nudge(edge, 'a', 'ArrowRight', false)[0]?.x).toBe(6);
  });

  it('resizes with a floor of two cells', () => {
    const small = [{ i: 'a', x: 0, y: 0, w: 2, h: 2 }];
    expect(nudge(small, 'a', 'ArrowLeft', true)[0]?.w).toBe(2);
    expect(nudge(layout, 'a', 'ArrowDown', true)[0]?.h).toBe(5);
  });
});
