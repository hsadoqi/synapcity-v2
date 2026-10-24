import { COLLAPSED_ROWS } from '@synapcity/domain-grids';
import { emptyRecords } from '@synapcity/domain-prototypes';
import { describe, expect, it } from 'vitest';

import type { WidgetType } from '../../types';
import { createWidget } from '../create-widget';
import { addWidget, setWidgetStatus, updateWidget } from '../widgets';
import {
  applyLayoutChange,
  createComposition,
  duplicateComposition,
  gridLayoutFor,
  layoutsForWidgets,
  updateSettings,
} from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };

function compositionWith(...types: WidgetType[]) {
  let c = createComposition();
  let records = emptyRecords();
  for (const type of types) {
    const created = createWidget(type, records, ctx);
    records = created.records;
    c = addWidget(c, created.widget);
  }
  return c;
}

describe('composition', () => {
  it('packs initial layouts from each widget type size', () => {
    const layouts = layoutsForWidgets(
      [
        { id: 's', type: 'stat' },
        { id: 'f', type: 'feed' },
      ],
      createComposition().settings,
    );
    expect(layouts.lg.map((l) => [l.x, l.y])).toEqual([
      [0, 0],
      [1, 0],
    ]);
    expect(layouts.sm.map((l) => l.y)).toEqual([0, 3]);
  });

  it('duplicates with fresh widget ids and remapped layouts', () => {
    const c = compositionWith('stat', 'tasks');
    const copy = duplicateComposition(c);
    const ids = new Set(copy.widgets.map((w) => w.id));
    expect(copy.widgets.some((w) => c.widgets.some((o) => o.id === w.id))).toBe(
      false,
    );
    for (const bp of ['lg', 'md', 'sm'] as const) {
      expect(copy.layouts[bp].every((l) => ids.has(l.i))).toBe(true);
    }
  });

  it('stores reported layout per breakpoint, preserving collapsed heights', () => {
    const c = compositionWith('feed');
    const id = c.widgets[0]!.id;
    const collapsed = updateWidget(c, id, { collapsed: true });
    const next = applyLayoutChange(collapsed, 'md', [
      { i: id, x: 1, y: 0, w: 1, h: 2 },
    ]);
    expect(next.layouts.md[0]).toEqual({ i: id, x: 1, y: 0, w: 1, h: 5 });
    expect(next.layouts.lg).toEqual(c.layouts.lg);
  });

  it('builds the grid for active widgets with breakpoint columns', () => {
    let c = compositionWith('stat', 'feed');
    const [stat, feed] = c.widgets;
    c = updateSettings(c, { columns: 4 });
    c = updateWidget(c, feed!.id, { collapsed: true });
    expect(gridLayoutFor(c, 'md').map((g) => g.maxW)).toEqual([3, 3]);
    expect(gridLayoutFor(c, 'lg')[1]).toMatchObject({ h: COLLAPSED_ROWS });
    c = setWidgetStatus(c, stat!.id, 'hidden');
    expect(gridLayoutFor(c, 'lg').map((g) => g.i)).toEqual([feed!.id]);
  });
});
