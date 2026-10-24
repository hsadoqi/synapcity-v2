import { emptyRecords } from '@synapcity/domain-prototypes';
import { describe, expect, it } from 'vitest';

import type { DashboardComposition, WidgetType } from '../types';
import { addWidget, createComposition, createWidget } from '../utils';
import { dashboardCompositionSchema } from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };
const TYPES: WidgetType[] = [
  'stat',
  'progress',
  'habit',
  'notes',
  'tasks',
  'calendar',
  'agenda',
  'feed',
];

function fullComposition(): DashboardComposition {
  let c = createComposition();
  let records = emptyRecords();
  for (const type of TYPES) {
    const created = createWidget(type, records, ctx);
    records = created.records;
    c = addWidget(c, created.widget);
  }
  return c;
}

describe('dashboardCompositionSchema', () => {
  it('accepts a composition built by the domain functions', () => {
    const c = fullComposition();
    expect(dashboardCompositionSchema.parse(c)).toEqual(c);
  });

  it('rejects settings outside their allowed values', () => {
    const c = fullComposition();
    for (const settings of [
      { ...c.settings, columns: 5 },
      { ...c.settings, cardRadius: 10 },
    ]) {
      expect(
        dashboardCompositionSchema.safeParse({ ...c, settings }).success,
      ).toBe(false);
    }
  });

  it('rejects a record-backed widget without a matching source kind', () => {
    const c = fullComposition();
    const stat = c.widgets.find((w) => w.type === 'stat')!;
    const widgets = [{ ...stat, source: { kind: 'goal', id: 'x' } }];
    expect(
      dashboardCompositionSchema.safeParse({ ...c, widgets }).success,
    ).toBe(false);
  });

  it('rejects a layout missing a breakpoint', () => {
    const c = fullComposition();
    const layouts = { lg: c.layouts.lg, md: c.layouts.md };
    expect(
      dashboardCompositionSchema.safeParse({ ...c, layouts }).success,
    ).toBe(false);
  });

  it('rejects duplicate widget IDs', () => {
    const c = fullComposition();
    const first = c.widgets[0]!;
    const widgets = [...c.widgets, { ...first, title: `${first.title} copy` }];

    expect(
      dashboardCompositionSchema.safeParse({ ...c, widgets }).success,
    ).toBe(false);
  });

  it('rejects layout IDs that do not reference a widget', () => {
    const c = fullComposition();
    const layouts = {
      ...c.layouts,
      md: [...c.layouts.md, { i: 'missing', x: 0, y: 0, w: 1, h: 1 }],
    };

    expect(
      dashboardCompositionSchema.safeParse({ ...c, layouts }).success,
    ).toBe(false);
  });

  it('rejects duplicate widget placements within one breakpoint', () => {
    const c = fullComposition();
    const first = c.layouts.lg[0]!;
    const layouts = { ...c.layouts, lg: [...c.layouts.lg, { ...first }] };

    expect(
      dashboardCompositionSchema.safeParse({ ...c, layouts }).success,
    ).toBe(false);
  });

  it('rejects negative or non-integer placements', () => {
    const c = fullComposition();
    for (const item of [
      { i: 'a', x: -1, y: 0, w: 1, h: 1 },
      { i: 'a', x: 0, y: 0, w: 1.5, h: 1 },
    ]) {
      const layouts = { ...c.layouts, lg: [item] };
      expect(
        dashboardCompositionSchema.safeParse({ ...c, layouts }).success,
      ).toBe(false);
    }
  });

  it('accepts a widget saved before locked, pinned and resizable existed', () => {
    const c = fullComposition();
    for (const w of c.widgets) {
      expect('locked' in w || 'pinned' in w || 'resizable' in w).toBe(false);
    }
    expect(dashboardCompositionSchema.safeParse(c).success).toBe(true);
  });

  it('accepts locked, pinned and resizable, and rejects them when not boolean', () => {
    const c = fullComposition();
    const first = c.widgets[0]!;
    const ok = {
      ...c,
      widgets: [
        { ...first, pinned: true, resizable: false },
        ...c.widgets.slice(1),
      ],
    };
    expect(dashboardCompositionSchema.safeParse(ok).success).toBe(true);
    const bad = {
      ...c,
      widgets: [{ ...first, pinned: 'yes' }, ...c.widgets.slice(1)],
    };
    expect(dashboardCompositionSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an agenda with a range other than day', () => {
    const c = fullComposition();
    const agenda = c.widgets.find((w) => w.type === 'agenda')!;
    const widgets = c.widgets.map((w) =>
      w.id === agenda.id ? { ...agenda, query: { range: 'week' } } : w,
    );
    expect(
      dashboardCompositionSchema.safeParse({ ...c, widgets }).success,
    ).toBe(false);
  });
});
