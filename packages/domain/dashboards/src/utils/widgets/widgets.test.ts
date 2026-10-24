import { emptyLayouts } from '@synapcity/domain-grids';
import { emptyRecords } from '@synapcity/domain-prototypes';
import { describe, expect, it } from 'vitest';

import type { DashboardComposition, WidgetType } from '../../types';
import { createWidget } from '../create-widget';
import {
  activeWidgets,
  addWidget,
  duplicateWidget,
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
});
