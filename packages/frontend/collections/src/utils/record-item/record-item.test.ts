import { describe, expect, it } from 'vitest';

import type { BaseRecord } from '@synapcity/domain-records';
import { itemFromRecord, type RecordLike } from './record-item';

const record: RecordLike = {
  id: 'r1',
  name: 'Launch plan',
  description: 'Steps.',
  icon: 'file-text',
  tags: ['work'],
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-03T14:30:00Z',
  pinnedAt: null,
  lastViewedAt: null,
};

describe('itemFromRecord', () => {
  it('maps a record onto the browse feature’s item', () => {
    expect(
      itemFromRecord(record, {
        href: '/u/home/things/r1',
        detail: 'In 2 spaces',
      }),
    ).toEqual({
      id: 'r1',
      title: 'Launch plan',
      subtitle: 'Steps.',
      updatedAt: record.updatedAt,
      createdAt: record.createdAt,
      tags: ['work'],
      pinned: false,
      icon: 'file-text',
      href: '/u/home/things/r1',
      lastViewedAt: undefined,
      detail: 'In 2 spaces',
    });
  });

  it('is pinned exactly when there is a pinned time', () => {
    const extras = { href: '/x' };
    expect(
      itemFromRecord({ ...record, pinnedAt: '2026-10-04T09:00:00Z' }, extras)
        .pinned,
    ).toBe(true);
    expect(itemFromRecord(record, extras).pinned).toBe(false);
  });

  it('carries the last-viewed time only when there is one', () => {
    const extras = { href: '/x' };
    expect(
      itemFromRecord(
        { ...record, lastViewedAt: '2026-10-05T18:00:00Z' },
        extras,
      ).lastViewedAt,
    ).toBe('2026-10-05T18:00:00Z');
    expect(itemFromRecord(record, extras).lastViewedAt).toBeUndefined();
  });
});

describe('RecordLike', () => {
  it('accepts every base record, so any resource built on the base contract fits', () => {
    const base: BaseRecord = {
      id: 'r1',
      ownerId: '11111111-1111-4111-8111-111111111111',
      name: 'Soup',
      icon: 'file-text',
      tags: [],
      createdAt: '2026-10-01T09:00:00Z',
      updatedAt: '2026-10-02T09:00:00Z',
      pinnedAt: null,
      lastViewedAt: null,
    };

    expect(itemFromRecord(base, { href: '/things/r1' })).toMatchObject({
      id: 'r1',
      title: 'Soup',
      pinned: false,
    });
  });
});
