import { emptyRecords } from '@synapcity/domain-prototypes';
import { describe, expect, it } from 'vitest';

import {
  MAX_COMPOSITION_BYTES,
  addWidget,
  applyLayoutChange,
  createComposition,
  createWidget,
  duplicateWidget,
  moveWidgetInOrder,
  parsePersistableComposition,
  removeWidget,
  updateSettings,
  updateWidget,
  type DashboardComposition,
} from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };

function with_(...types: Parameters<typeof createWidget>[0][]) {
  return types.reduce(
    (c, type) => addWidget(c, createWidget(type, emptyRecords(), ctx).widget),
    createComposition(),
  );
}

describe('parsePersistableComposition', () => {
  it('accepts an empty composition and one of link widgets', () => {
    expect(parsePersistableComposition(createComposition()).ok).toBe(true);
    const c = with_('pinned', 'last-opened', 'spaces');
    expect(parsePersistableComposition(c)).toEqual({
      ok: true,
      composition: c,
    });
  });

  it('survives a JSON round trip, as it arrives from the browser', () => {
    const c = with_('pinned');
    const result = parsePersistableComposition(JSON.parse(JSON.stringify(c)));
    expect(result).toEqual({ ok: true, composition: c });
  });

  it.each([null, 'x', 42, {}, { settings: {} }])(
    'refuses %j as invalid',
    (input) => {
      expect(parsePersistableComposition(input)).toEqual({
        ok: false,
        reason: 'invalid',
      });
    },
  );

  it('refuses a widget type that owns data', () => {
    expect(parsePersistableComposition(with_('pinned', 'tasks'))).toEqual({
      ok: false,
      reason: 'widget-type',
    });
  });

  it('refuses a hidden or archived widget', () => {
    const c = with_('pinned');
    const hidden = {
      ...c,
      widgets: c.widgets.map((w) => ({ ...w, status: 'hidden' as const })),
    };
    expect(parsePersistableComposition(hidden)).toEqual({
      ok: false,
      reason: 'widget-status',
    });
  });

  it('refuses a composition over the size cap, whole', () => {
    const c = with_('pinned');
    const fat = {
      ...c,
      widgets: c.widgets.map((w) => ({
        ...w,
        title: 'x'.repeat(MAX_COMPOSITION_BYTES),
      })),
    };
    expect(parsePersistableComposition(fat)).toEqual({
      ok: false,
      reason: 'too-large',
    });
  });

  describe('text the database cannot store', () => {
    const withTitle = (title: string) => {
      const c = with_('pinned');
      return { ...c, widgets: c.widgets.map((w) => ({ ...w, title })) };
    };

    it.each([
      ['a NUL', 'Pin\u0000ned'],
      ['an unpaired high surrogate', 'Pinned \uD83D'],
      ['an unpaired low surrogate', '\uDE00 Pinned'],
    ])('refuses a title with %s, whole, never cleaned', (_name, title) => {
      expect(parsePersistableComposition(withTitle(title))).toEqual({
        ok: false,
        reason: 'invalid-text',
      });
    });

    it('accepts an astral character, which is a valid surrogate pair', () => {
      expect(parsePersistableComposition(withTitle('Ideas 💡')).ok).toBe(true);
    });

    it('refuses an unknown key even when it holds unstorable text', () => {
      // Unknown keys used to be stripped and the rest stored; they are now
      // refused, so this document never reaches the text check.
      const c = with_('pinned');
      const widget = c.widgets[0]!;
      const config = { ...widget, config: { ['bad\u0000key']: 1 } };
      expect(parsePersistableComposition({ ...c, widgets: [config] })).toEqual({
        ok: false,
        reason: 'unknown-keys',
      });
    });
  });
});

describe('unknown keys at the write boundary', () => {
  const c = with_('pinned', 'spaces');
  const widget = c.widgets[0]!;
  // Changes the first widget in place, so the layouts still match.
  const withFirst = (changed: object) => [changed, ...c.widgets.slice(1)];

  it.each<[string, () => unknown]>([
    ['at the top level', () => ({ ...c, extra: 1 })],
    [
      'in the settings',
      () => ({ ...c, settings: { ...c.settings, theme: 'x' } }),
    ],
    [
      'in a widget',
      () => ({ ...c, widgets: withFirst({ ...widget, secret: 'x' }) }),
    ],
    [
      'in a widget query',
      () => ({
        ...c,
        widgets: withFirst({ ...widget, query: { limit: 6, sort: 'name' } }),
      }),
    ],
    [
      'in a layout item',
      () => ({
        ...c,
        layouts: {
          ...c.layouts,
          lg: c.layouts.lg.map((item) => ({ ...item, z: 1 })),
        },
      }),
    ],
    ['in the layouts', () => ({ ...c, layouts: { ...c.layouts, xl: [] } })],
  ])('refuses an unknown key %s, and stores nothing', (_, build) => {
    expect(parsePersistableComposition(build())).toEqual({
      ok: false,
      reason: 'unknown-keys',
    });
  });

  it('reports an invalid known field as invalid, even beside an unknown key', () => {
    expect(
      parsePersistableComposition({
        ...c,
        extra: 1,
        settings: { ...c.settings, columns: 9 },
      }),
    ).toEqual({ ok: false, reason: 'invalid' });
  });

  it('keeps reads tolerant: the read schema drops what the write refuses', async () => {
    const { dashboardCompositionSchema } = await import('./index');
    const parsed = dashboardCompositionSchema.parse({ ...c, extra: 1 });
    expect(parsed).toEqual(c);
  });
});

describe('every composition the domain operations produce stays persistable', () => {
  // The browser store changes a composition only through these operations, so
  // a strict write boundary must accept everything they can produce.
  const base = with_('pinned', 'last-opened', 'spaces');
  const first = base.widgets[0]!.id;
  const steps: [string, (c: DashboardComposition) => DashboardComposition][] = [
    [
      'an update of every patchable field',
      (c) =>
        updateWidget(c, first, {
          title: 'Renamed',
          collapsed: true,
          highlight: 'accent',
          locked: true,
          pinned: true,
          resizable: false,
        }),
    ],
    ['a duplicate', (c) => duplicateWidget(c, first)],
    ['a move in reading order', (c) => moveWidgetInOrder(c, 'lg', first, 1)],
    [
      'a layout reported by the grid',
      (c) =>
        applyLayoutChange(
          c,
          'md',
          c.layouts.md.map((l) => ({ ...l, y: l.y + 1 })),
        ),
    ],
    [
      'new settings',
      (c) =>
        updateSettings(c, {
          columns: 4,
          cardRadius: 16,
          showWidgetTitles: false,
        }),
    ],
    ['a removal', (c) => removeWidget(c, first)],
  ];

  it.each(steps)('after %s', (_, step) => {
    const next = step(base);
    expect(parsePersistableComposition(next)).toEqual({
      ok: true,
      composition: next,
    });
    // And after the JSON round trip a Server Action applies.
    expect(
      parsePersistableComposition(JSON.parse(JSON.stringify(next))).ok,
    ).toBe(true);
  });

  it('after every step in sequence', () => {
    const final = steps.reduce((c, [, step]) => step(c), base);
    expect(parsePersistableComposition(final).ok).toBe(true);
  });
});
