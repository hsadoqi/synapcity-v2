import { describe, expect, it } from 'vitest';

import { createSpaceEntity } from './space-entity';

describe('createSpaceEntity', () => {
  it('has fixed timestamps and rejects an invalid one', () => {
    expect(createSpaceEntity()).toMatchObject({
      createdAt: '2026-10-01T09:00:00Z',
      updatedAt: '2026-10-03T14:30:00Z',
    });
    expect(() => createSpaceEntity({ createdAt: 'yesterday' })).toThrow();
  });

  it('creates independent deterministic records', () => {
    const first = createSpaceEntity();
    const second = createSpaceEntity();

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    first.name = 'Changed';
    first.tags.push('changed');
    expect(second.name).toBe('Writing');
    expect(second.tags).toEqual(['writing', 'ideas']);
  });

  it('applies and validates overrides', () => {
    expect(
      createSpaceEntity({
        id: 'fixture-custom',
        name: '  Custom  ',
        description: undefined,
        tags: [],
        updatedAt: '2026-10-06T12:00:00+00:00',
      }),
    ).toEqual({
      id: 'fixture-custom',
      ownerId: '11111111-1111-4111-8111-111111111111',
      name: 'Custom',
      icon: 'pen-line',
      description: undefined,
      tags: [],
      createdAt: '2026-10-01T09:00:00Z',
      updatedAt: '2026-10-06T12:00:00+00:00',
      pinnedAt: null,
      lastViewedAt: null,
    });
    expect(() => createSpaceEntity({ name: '   ' })).toThrow();
    expect(() => createSpaceEntity({ id: '' })).toThrow();
  });
});
