import { describe, expect, it } from 'vitest';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

import { spaceSchema } from '../../../shared/schema';
import { SPACE_FIXTURES, createSpaceFixture } from '../index';

describe('space fixtures', () => {
  it('provides valid sample records with distinct IDs', () => {
    expect(SPACE_FIXTURES.length).toBeGreaterThan(0);
    expect(new Set(SPACE_FIXTURES.map((space) => space.id)).size).toBe(
      SPACE_FIXTURES.length,
    );
    for (const space of SPACE_FIXTURES) {
      expect(spaceSchema.parse(space)).toEqual(space);
    }
  });

  it('covers spaces with and without a description', () => {
    expect(SPACE_FIXTURES.some((space) => Boolean(space.description))).toBe(
      true,
    );
    expect(
      SPACE_FIXTURES.some((space) => space.description === undefined),
    ).toBe(true);
  });

  it('uses icon names available in the installed Lucide package', () => {
    for (const space of SPACE_FIXTURES) {
      expect(Object.hasOwn(dynamicIconImports, space.icon)).toBe(true);
    }
  });

  it('covers tagged and untagged spaces with fixed timestamps', () => {
    expect(SPACE_FIXTURES.some((space) => space.tags.length > 0)).toBe(true);
    expect(SPACE_FIXTURES.some((space) => space.tags.length === 0)).toBe(true);
    expect(createSpaceFixture()).toMatchObject({
      createdAt: '2026-10-01T09:00:00Z',
      updatedAt: '2026-10-03T14:30:00Z',
    });
    expect(() => createSpaceFixture({ createdAt: 'yesterday' })).toThrow();
  });

  it('creates independent deterministic records', () => {
    const first = createSpaceFixture();
    const second = createSpaceFixture();

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    first.name = 'Changed';
    first.tags.push('changed');
    expect(second.name).toBe('Writing');
    expect(second.tags).toEqual(['writing', 'ideas']);
    expect(SPACE_FIXTURES[0]?.name).toBe('Writing');
    expect(SPACE_FIXTURES[0]?.tags).toEqual(['writing', 'ideas']);
  });

  it('applies and validates overrides', () => {
    expect(
      createSpaceFixture({
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
    });
    expect(() => createSpaceFixture({ name: '   ' })).toThrow();
    expect(() => createSpaceFixture({ id: '' })).toThrow();
  });
});
