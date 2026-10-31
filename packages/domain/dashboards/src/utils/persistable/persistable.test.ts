import { emptyRecords } from '@synapcity/domain-prototypes';
import { describe, expect, it } from 'vitest';

import { addWidget, createComposition, createWidget } from '../index';
import { MAX_COMPOSITION_BYTES, parsePersistableComposition } from './index';

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
});
