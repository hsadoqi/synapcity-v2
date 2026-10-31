import { emptyLayouts } from '@synapcity/domain-grids';
import { emptyRecords } from '@synapcity/domain-prototypes';
import { describe, expect, it } from 'vitest';

import type { DashboardComposition, WidgetType } from '../../types';
import { createWidget } from '../create-widget';
import {
  activeWidgets,
  addWidget,
  duplicateWidget,
  LINK_WIDGET_TYPES,
  moveWidgetInOrder,
  removeWidget,
  setWidgetStatus,
  updateWidget,
  widgetsWithStatus,
} from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };

function compositionWith(...types: WidgetType[]) {
  let c: DashboardComposition = {
    settings: { columns: 3, cardRadius: 8, showWidgetTitles: true },
    widgets: [],
    layouts: emptyLayouts(),
  };
  let records = emptyRecords();
  for (const type of types) {
    const created = createWidget(type, records, ctx);
    records = created.records;
    c = addWidget(c, created.widget);
  }
  return { c, records };
}

describe('widget operations', () => {
  it('duplicates a widget as a second view of the same record', () => {
    const { c } = compositionWith('notes');
    const original = c.widgets[0]!;
    const next = duplicateWidget(c, original.id);
    const copy = next.widgets[1]!;
    expect(copy.id).not.toBe(original.id);
    expect(copy.title).toBe('Notes copy');
    expect('source' in copy && copy.source).toEqual(
      'source' in original && original.source,
    );
    expect(next.layouts.lg.map((l) => l.i)).toContain(copy.id);
    expect(duplicateWidget(c, 'missing')).toBe(c);
  });

  it('hides, archives and restores widgets through the layout', () => {
    const { c } = compositionWith('stat', 'feed');
    const id = c.widgets[0]!.id;
    const hidden = setWidgetStatus(c, id, 'hidden');
    expect(activeWidgets(hidden).map((w) => w.id)).not.toContain(id);
    expect(widgetsWithStatus(hidden, 'hidden').map((w) => w.id)).toEqual([id]);
    expect(hidden.layouts.lg.some((l) => l.i === id)).toBe(false);
    const restored = setWidgetStatus(hidden, id, 'active');
    expect(restored.layouts.sm.some((l) => l.i === id)).toBe(true);
    expect(setWidgetStatus(restored, id, 'active')).toBe(restored);
  });

  it('adds a hidden or archived widget without a layout entry', () => {
    const { c } = compositionWith();
    const { widget } = createWidget('stat', emptyRecords(), ctx);
    const next = addWidget(c, { ...widget, status: 'archived' });
    expect(next.widgets).toHaveLength(1);
    expect(next.layouts.lg).toHaveLength(0);
    expect(next.layouts.sm).toHaveLength(0);
  });

  it('ignores a widget whose id is already on the dashboard', () => {
    const { c } = compositionWith('stat');
    expect(addWidget(c, { ...c.widgets[0]!, title: 'Again' })).toBe(c);
  });

  it('removes a widget without touching its record', () => {
    const { c, records } = compositionWith('progress');
    const next = removeWidget(c, c.widgets[0]!.id);
    expect(next.widgets).toHaveLength(0);
    expect(next.layouts.lg).toHaveLength(0);
    expect(Object.keys(records.goal)).toHaveLength(1);
  });

  it('returns the same composition when removing a widget that is not there', () => {
    const { c } = compositionWith('stat');
    expect(removeWidget(c, 'missing')).toBe(c);
  });

  it('only patches presentation fields', () => {
    const { c } = compositionWith('stat');
    const id = c.widgets[0]!.id;
    const next = updateWidget(c, id, {
      title: 'Renamed',
      collapsed: true,
      highlight: 'accent',
    });
    expect(next.widgets[0]).toMatchObject({
      title: 'Renamed',
      collapsed: true,
      highlight: 'accent',
    });
    expect(updateWidget(c, 'missing', { title: 'x' })).toBe(c);
  });

  it('returns the same composition when a patch changes nothing', () => {
    const { c } = compositionWith('stat');
    const widget = c.widgets[0]!;

    expect(updateWidget(c, widget.id, { title: widget.title })).toBe(c);
  });
});

describe('LINK_WIDGET_TYPES', () => {
  it('names the three link widgets only', () => {
    expect(LINK_WIDGET_TYPES).toEqual(['pinned', 'last-opened', 'spaces']);
  });
});

describe('moveWidgetInOrder', () => {
  const orderAt = (c: DashboardComposition, bp: 'lg' | 'md' | 'sm') =>
    [...c.layouts[bp]]
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((item) => c.widgets.find((w) => w.id === item.i)?.title);

  it('swaps a widget with its neighbour in reading order and repacks', () => {
    const { c } = compositionWith('pinned', 'spaces', 'last-opened');
    expect(orderAt(c, 'lg')).toEqual(['Pinned', 'Spaces', 'Last opened']);
    const id = c.widgets[2]!.id;

    const next = moveWidgetInOrder(c, 'lg', id, -1);

    expect(orderAt(next, 'lg')).toEqual(['Pinned', 'Last opened', 'Spaces']);
    // Other breakpoints keep their own arrangement.
    expect(orderAt(next, 'sm')).toEqual(orderAt(c, 'sm'));
    // Sizes survive the repack, and no two widgets overlap.
    const cells = new Set(
      next.layouts.lg.flatMap((l) =>
        Array.from(
          { length: l.w * l.h },
          (_, n) => `${l.x + (n % l.w)},${l.y + Math.floor(n / l.w)}`,
        ),
      ),
    );
    expect(cells.size).toBe(
      next.layouts.lg.reduce((sum, l) => sum + l.w * l.h, 0),
    );
  });

  it('leaves the composition alone at either end, for a locked or missing widget', () => {
    const { c } = compositionWith('pinned', 'spaces');
    const [first, second] = c.widgets;
    expect(moveWidgetInOrder(c, 'lg', first!.id, -1)).toBe(c);
    expect(moveWidgetInOrder(c, 'lg', second!.id, 1)).toBe(c);
    expect(moveWidgetInOrder(c, 'lg', 'nope', 1)).toBe(c);
    const locked = updateWidget(c, first!.id, { locked: true });
    expect(moveWidgetInOrder(locked, 'lg', first!.id, 1)).toBe(locked);
  });
});
