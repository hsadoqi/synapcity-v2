import { describe, expect, it } from 'vitest';

import type { SpaceSummary } from '../../shared/types';
import { describeContents, toCollectionItem } from './collection-item';

const space: SpaceSummary = {
  id: 'space-1',
  ownerId: '11111111-1111-4111-8111-111111111111',
  name: 'Writing',
  description: 'Drafts.',
  icon: 'pen-line',
  tags: ['writing'],
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-03T14:30:00Z',
  pinnedAt: null,
  lastViewedAt: null,
  documentsTotal: 14,
  dashboardsTotal: 2,
};

describe('describeContents', () => {
  it.each([
    [14, 2, '14 documents · 2 dashboards'],
    [1, 1, '1 document · 1 dashboard'],
    [3, 0, '3 documents'],
    [0, 1, '1 dashboard'],
    [0, 0, 'Nothing in it yet'],
  ])('describes %i documents and %i dashboards', (docs, dashes, expected) => {
    expect(describeContents(docs, dashes)).toBe(expected);
  });
});

describe('toCollectionItem', () => {
  it('maps a space onto the browse feature’s item', () => {
    expect(toCollectionItem(space, 'user-1')).toEqual({
      id: 'space-1',
      title: 'Writing',
      subtitle: 'Drafts.',
      updatedAt: space.updatedAt,
      createdAt: space.createdAt,
      tags: ['writing'],
      pinned: false,
      icon: 'pen-line',
      href: '/user-1/home/spaces/space-1',
      lastViewedAt: undefined,
      detail: '14 documents · 2 dashboards',
    });
  });

  it('is pinned exactly when the space has a pinned time', () => {
    expect(
      toCollectionItem({ ...space, pinnedAt: '2026-10-04T09:00:00Z' }, 'u')
        .pinned,
    ).toBe(true);
    expect(toCollectionItem(space, 'u').pinned).toBe(false);
  });

  it('carries the last-viewed time only when there is one', () => {
    expect(
      toCollectionItem({ ...space, lastViewedAt: '2026-10-05T18:00:00Z' }, 'u')
        .lastViewedAt,
    ).toBe('2026-10-05T18:00:00Z');
    expect(toCollectionItem(space, 'u').lastViewedAt).toBeUndefined();
  });
});
