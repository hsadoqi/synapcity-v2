import { describe, expect, it } from 'vitest';

import type { RecordSummary } from '@/lib/records/record-summary';

import { describeSpaces, toCollectionItem } from './collection-item';

const record: RecordSummary = {
  id: 'dashboard-1',
  ownerId: '11111111-1111-4111-8111-111111111111',
  name: 'Launch plan',
  description: 'Steps.',
  icon: 'layout-dashboard',
  tags: ['work'],
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-03T14:30:00Z',
  pinnedAt: null,
  lastViewedAt: null,
  spacesTotal: 2,
};

describe('describeSpaces', () => {
  it.each([
    [0, 'Not in a space'],
    [1, 'In 1 space'],
    [3, 'In 3 spaces'],
  ])('describes %i spaces', (count, expected) => {
    expect(describeSpaces(count)).toBe(expected);
  });
});

describe('toCollectionItem', () => {
  it('maps a dashboard onto the browse feature’s item, linked under the owner', () => {
    expect(toCollectionItem(record, 'user-1')).toMatchObject({
      id: 'dashboard-1',
      title: 'Launch plan',
      subtitle: 'Steps.',
      icon: 'layout-dashboard',
      href: '/user-1/home/dashboards/dashboard-1',
      detail: 'In 2 spaces',
      pinned: false,
    });
  });

  it('is pinned when it has a pinned time', () => {
    expect(
      toCollectionItem({ ...record, pinnedAt: '2026-10-04T09:00:00Z' }, 'u')
        .pinned,
    ).toBe(true);
  });
});
