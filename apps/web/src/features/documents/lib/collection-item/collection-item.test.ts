import { describe, expect, it } from 'vitest';

import type { OwnedRecordSummary } from '@/lib/owned-records';

import { describeSpaces, toCollectionItem } from './collection-item';

const record: OwnedRecordSummary = {
  id: 'document-1',
  ownerId: '11111111-1111-4111-8111-111111111111',
  name: 'Launch plan',
  description: 'Steps.',
  icon: 'file-text',
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
  it('maps a document onto the browse feature’s item, linked under the owner', () => {
    expect(toCollectionItem(record, 'user-1')).toMatchObject({
      id: 'document-1',
      title: 'Launch plan',
      subtitle: 'Steps.',
      icon: 'file-text',
      href: '/user-1/home/documents/document-1',
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
