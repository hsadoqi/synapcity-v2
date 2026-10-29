import type { BaseRecord } from '@synapcity/domain-records';
import { describe, expect, it } from 'vitest';

import { toLinkItems } from './link-items';

const record = (
  id: string,
  overrides: Partial<BaseRecord> = {},
): BaseRecord => ({
  id,
  ownerId: 'owner',
  name: `Name ${id}`,
  icon: 'folder',
  tags: [],
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  pinnedAt: null,
  lastViewedAt: null,
  ...overrides,
});

describe('toLinkItems', () => {
  it('lists Spaces, documents and dashboards with the page each opens', () => {
    const items = toLinkItems('u1', {
      space: [record('s1')],
      document: [record('d1')],
      dashboard: [record('b1', { pinnedAt: '2026-10-02T00:00:00Z' })],
    });

    expect(items).toEqual([
      expect.objectContaining({
        kind: 'space',
        id: 's1',
        href: '/u1/home/spaces/s1',
      }),
      expect.objectContaining({
        kind: 'document',
        id: 'd1',
        href: '/u1/home/documents/d1',
      }),
      expect.objectContaining({
        kind: 'dashboard',
        id: 'b1',
        href: '/u1/home/dashboards/b1',
        pinnedAt: '2026-10-02T00:00:00Z',
      }),
    ]);
  });

  it('keeps the order within a kind and carries the timestamps and icon', () => {
    const items = toLinkItems('u1', {
      space: [
        record('b'),
        record('a', { lastViewedAt: '2026-10-03T00:00:00Z', icon: 'book' }),
      ],
      document: [],
      dashboard: [],
    });
    expect(items.map((i) => i.id)).toEqual(['b', 'a']);
    expect(items[1]).toMatchObject({
      icon: 'book',
      lastViewedAt: '2026-10-03T00:00:00Z',
    });
  });

  it('encodes a user id into a single path segment', () => {
    const [item] = toLinkItems('a/b', {
      space: [record('s1')],
      document: [],
      dashboard: [],
    });
    expect(item?.href).toBe('/a%2Fb/home/spaces/s1');
  });
});
