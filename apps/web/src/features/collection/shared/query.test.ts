import { describe, expect, it } from 'vitest';

import {
  applyCollectionQuery,
  applyItemAction,
  formatAgo,
  formatUpdated,
} from './query';
import {
  countActiveFilters,
  EMPTY_FILTERS,
  hasActiveFilters,
  type CollectionItem,
  type CollectionSort,
} from './types';

const NOW = new Date('2026-10-10T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * DAY).toISOString();

function item(
  overrides: Partial<CollectionItem> & { id: string },
): CollectionItem {
  return {
    title: overrides.id,
    updatedAt: daysAgo(0),
    tags: [],
    pinned: false,
    ...overrides,
  };
}

const BY_UPDATED: CollectionSort = { field: 'updated', direction: 'desc' };
const ids = (items: CollectionItem[]) => items.map((entry) => entry.id);
const query = (
  items: CollectionItem[],
  options: Partial<Parameters<typeof applyCollectionQuery>[1]> = {},
) =>
  applyCollectionQuery(items, {
    query: '',
    filters: EMPTY_FILTERS,
    sort: BY_UPDATED,
    now: NOW,
    ...options,
  });

describe('formatUpdated', () => {
  it.each([
    [0, 'Updated today'],
    [1, 'Updated yesterday'],
    [6, 'Updated 6 days ago'],
    [7, 'Updated last week'],
    [14, 'Updated 2 weeks ago'],
    [30, 'Updated last month'],
    [65, 'Updated 2 months ago'],
  ])('%i days ago reads "%s"', (days, label) => {
    expect(formatUpdated(daysAgo(days), NOW)).toBe(label);
  });

  it('treats a time in the future as today rather than a negative age', () => {
    expect(formatUpdated(daysAgo(-3), NOW)).toBe('Updated today');
  });
});

describe('formatAgo', () => {
  const at = (iso: string) => formatAgo(iso, NOW, 'UTC');

  it.each([
    ['2026-10-10T11:59:40Z', 'Just now'],
    ['2026-10-10T11:20:00Z', '40m ago'],
    ['2026-10-10T09:30:00Z', '2h ago'],
    ['2026-10-10T00:05:00Z', '11h ago'],
    ['2026-10-09T23:50:00Z', 'Yesterday'],
    ['2026-10-09T00:10:00Z', 'Yesterday'],
    ['2026-10-07T12:00:00Z', '3d ago'],
    ['2026-10-03T12:00:00Z', 'Last week'],
    ['2026-09-19T12:00:00Z', '3w ago'],
    ['2026-09-05T12:00:00Z', 'Last month'],
    ['2026-06-01T12:00:00Z', '4mo ago'],
  ])('%s reads "%s"', (iso, label) => {
    expect(at(iso)).toBe(label);
  });

  it('counts days by the calendar, so ten minutes before midnight is yesterday', () => {
    const justAfterMidnight = new Date('2026-10-10T00:05:00Z');
    expect(formatAgo('2026-10-09T23:55:00Z', justAfterMidnight, 'UTC')).toBe(
      'Yesterday',
    );
  });

  it('uses the given time zone to decide which day it is', () => {
    // 02:00 UTC on the 10th is still the evening of the 9th in New York.
    const morning = new Date('2026-10-10T13:00:00Z');
    expect(formatAgo('2026-10-10T02:00:00Z', morning, 'UTC')).toBe('11h ago');
    expect(formatAgo('2026-10-10T02:00:00Z', morning, 'America/New_York')).toBe(
      'Yesterday',
    );
  });

  it('treats a time in the future as just now', () => {
    expect(at('2026-10-10T12:30:00Z')).toBe('Just now');
  });
});

describe('applyCollectionQuery', () => {
  describe('search', () => {
    const items = [
      item({ id: 'a', title: 'Weekly review' }),
      item({ id: 'b', title: 'Garden', subtitle: 'Frost risk and beans' }),
      item({ id: 'c', title: 'Trip', group: 'Travel: Lisbon' }),
      item({ id: 'd', title: 'Budget', tags: ['finance'] }),
    ];

    it('matches the title, subtitle, group and tags, ignoring case and outer spaces', () => {
      expect(ids(query(items, { query: '  WEEKLY ' }))).toEqual(['a']);
      expect(ids(query(items, { query: 'frost' }))).toEqual(['b']);
      expect(ids(query(items, { query: 'lisbon' }))).toEqual(['c']);
      expect(ids(query(items, { query: 'fin' }))).toEqual(['d']);
    });

    it('keeps everything for an empty or blank query', () => {
      expect(query(items, { query: '   ' })).toHaveLength(4);
    });
  });

  describe('filters', () => {
    it('keeps only pinned items when pinned is on', () => {
      const items = [item({ id: 'a', pinned: true }), item({ id: 'b' })];
      expect(
        ids(query(items, { filters: { ...EMPTY_FILTERS, pinned: true } })),
      ).toEqual(['a']);
    });

    it('treats the last seven days, inclusive, as recent', () => {
      const items = [
        item({ id: 'seven', updatedAt: daysAgo(7) }),
        item({ id: 'eight', updatedAt: daysAgo(8) }),
      ];
      expect(
        ids(query(items, { filters: { ...EMPTY_FILTERS, recent: true } })),
      ).toEqual(['seven']);
    });

    it('keeps items in any selected group, and drops items with no group', () => {
      const items = [
        item({ id: 'home', group: 'Home' }),
        item({ id: 'health', group: 'Health' }),
        item({ id: 'studio', group: 'Studio' }),
        item({ id: 'loose' }),
      ];
      const filters = { ...EMPTY_FILTERS, groups: ['Home', 'Studio'] };
      expect(ids(query(items, { filters })).sort()).toEqual(['home', 'studio']);
    });

    it('applies every active filter at once', () => {
      const items = [
        item({ id: 'match', pinned: true, group: 'Home' }),
        item({ id: 'unpinned', group: 'Home' }),
        item({ id: 'elsewhere', pinned: true, group: 'Health' }),
      ];
      const filters = { pinned: true, recent: false, groups: ['Home'] };
      expect(ids(query(items, { filters }))).toEqual(['match']);
    });
  });

  describe('sort', () => {
    const items = [
      item({
        id: 'b',
        title: 'Beta',
        updatedAt: daysAgo(2),
        createdAt: daysAgo(1),
      }),
      item({
        id: 'a',
        title: 'alpha',
        updatedAt: daysAgo(1),
        createdAt: daysAgo(9),
      }),
      item({ id: 'c', title: 'Gamma', updatedAt: daysAgo(3) }),
    ];

    it('sorts by title, A to Z or back', () => {
      const asc = { field: 'title', direction: 'asc' } as const;
      expect(ids(query(items, { sort: asc }))).toEqual(['a', 'b', 'c']);
      expect(
        ids(query(items, { sort: { ...asc, direction: 'desc' } })),
      ).toEqual(['c', 'b', 'a']);
    });

    it('sorts by last update, newest first by default', () => {
      expect(ids(query(items))).toEqual(['a', 'b', 'c']);
    });

    it('sorts by creation, using the update time for items with no creation time', () => {
      const created = { field: 'created', direction: 'desc' } as const;
      // b created 1 day ago, c has none so counts as updated 3 days ago, a created 9 days ago.
      expect(ids(query(items, { sort: created }))).toEqual(['b', 'c', 'a']);
    });
  });

  it('leaves the input list untouched', () => {
    const items = [
      item({ id: 'old', updatedAt: daysAgo(5) }),
      item({ id: 'new', updatedAt: daysAgo(0) }),
    ];
    query(items);
    expect(ids(items)).toEqual(['old', 'new']);
  });
});

describe('applyItemAction', () => {
  const list = [
    item({ id: 'a', pinned: false }),
    item({ id: 'b', title: 'Budget', pinned: true, updatedAt: daysAgo(4) }),
  ];

  it('toggles the pin of the target only', () => {
    const next = applyItemAction(list, 'toggle-pin', list[0]!, NOW);
    expect(next.map((entry) => entry.pinned)).toEqual([true, true]);
    expect(next[1]).toBe(list[1]);
  });

  it('puts an unpinned copy, dated now, at the top', () => {
    const next = applyItemAction(list, 'duplicate', list[1]!, NOW);
    expect(next).toHaveLength(3);
    expect(next[0]).toMatchObject({
      id: 'b-copy-2',
      title: 'Budget (copy)',
      pinned: false,
      updatedAt: NOW.toISOString(),
      createdAt: NOW.toISOString(),
    });
  });

  it('removes the target on delete', () => {
    expect(ids(applyItemAction(list, 'delete', list[0]!, NOW))).toEqual(['b']);
  });

  it.each(['open', 'rename'] as const)(
    'returns the same list for %s, so callers can skip the update',
    (action) => {
      expect(applyItemAction(list, action, list[0]!, NOW)).toBe(list);
    },
  );
});

describe('active filters', () => {
  it('counts each toggle and each selected group', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);

    const filters = { pinned: true, recent: true, groups: ['Home', 'Health'] };
    expect(countActiveFilters(filters)).toBe(4);
    expect(hasActiveFilters(filters)).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, groups: ['Home'] })).toBe(true);
  });
});
