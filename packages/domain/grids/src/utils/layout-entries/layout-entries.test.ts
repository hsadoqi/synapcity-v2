import { describe, expect, it } from 'vitest';

import type { BreakpointSizes } from '../../types';
import {
  appendLayoutEntry,
  emptyLayouts,
  layoutsForItems,
  removeLayoutEntry,
} from './index';

const size = (h: number, smH = h): BreakpointSizes => ({
  lg: { w: 1, h, minW: 1, minH: 2 },
  md: { w: 1, h, minW: 1, minH: 2 },
  sm: { w: 1, h: smH, minW: 1, minH: 2 },
});

const items = [
  { id: 's', sizes: size(3) },
  { id: 'f', sizes: size(5, 6) },
];

describe('layout entries', () => {
  it('creates a layout for every breakpoint', () => {
    const layouts = layoutsForItems(items, 3);
    expect(layouts.lg).toHaveLength(2);
    expect(layouts.sm.map((l) => l.y)).toEqual([0, 3]);
  });

  it('appends below the lowest item and removes from all breakpoints', () => {
    const added = appendLayoutEntry(layoutsForItems(items, 3), 'n', size(4));
    expect(added.lg.at(-1)).toEqual({ i: 'n', x: 0, y: 5, w: 1, h: 4 });
    expect(added.sm.at(-1)?.y).toBe(9);
    const removed = removeLayoutEntry(added, 'n');
    expect(removed.lg.some((l) => l.i === 'n')).toBe(false);
    expect(removed.md.some((l) => l.i === 'n')).toBe(false);
  });

  it('does not duplicate an entry that is appended twice', () => {
    const once = appendLayoutEntry(emptyLayouts(), 'n', size(4));
    const twice = appendLayoutEntry(once, 'n', size(4));
    expect(twice.lg.filter((l) => l.i === 'n')).toHaveLength(1);
  });
});
