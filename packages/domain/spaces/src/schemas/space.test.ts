import { describe, expect, expectTypeOf, it } from 'vitest';

import type { CreateSpaceInput, SpaceEntity, UpdateSpaceInput } from '../types';
import { editableFieldsOf, RECORD_MESSAGES } from '@synapcity/domain-records';
import { limitVectorMismatches } from '@synapcity/domain-records/testing';

import { createSpaceSchema, spaceSchema, updateSpaceSchema } from './index';

const savedSpace = {
  id: 'opaque/id',
  ownerId: '11111111-1111-4111-8111-111111111111',
  name: 'Writing',
  icon: 'pen-line',
  tags: ['writing'],
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-03T14:30:00Z',
  pinnedAt: null,
  lastViewedAt: null,
};

describe('spaceSchema', () => {
  it('defaults the pinned and last-viewed times to null when absent', () => {
    const { pinnedAt, lastViewedAt, ...withoutState } = savedSpace;
    void pinnedAt;
    void lastViewedAt;

    expect(spaceSchema.parse(withoutState)).toMatchObject({
      pinnedAt: null,
      lastViewedAt: null,
    });
  });

  it('keeps the pinned and last-viewed times when they are set', () => {
    const space = spaceSchema.parse({
      ...savedSpace,
      pinnedAt: '2026-10-04T09:00:00Z',
      lastViewedAt: '2026-10-05T18:00:00+00:00',
    });

    expect(space.pinnedAt).toBe('2026-10-04T09:00:00Z');
    expect(space.lastViewedAt).toBe('2026-10-05T18:00:00+00:00');
  });

  it.each(['pinnedAt', 'lastViewedAt'])('rejects a malformed %s', (field) => {
    const result = spaceSchema.safeParse({ ...savedSpace, [field]: 'today' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual([field]);
  });

  it('accepts a saved space and infers the shared type', () => {
    const space = spaceSchema.parse(savedSpace);

    expect(space).toEqual(savedSpace);
    expectTypeOf(space).toEqualTypeOf<SpaceEntity>();
  });

  it('trims the name while preserving the ID and description', () => {
    expect(
      spaceSchema.parse({
        ...savedSpace,
        name: '  Writing  ',
        description: '  First draft\nSecond draft  ',
      }),
    ).toEqual({
      ...savedSpace,
      description: '  First draft\nSecond draft  ',
    });
  });

  it('accepts an empty description and no tags', () => {
    expect(
      spaceSchema.parse({ ...savedSpace, description: '', tags: [] }),
    ).toEqual({ ...savedSpace, description: '', tags: [] });
  });

  it('preserves timestamps with explicit offsets as strings', () => {
    const updatedAt = '2026-10-03T10:30:00-04:00';
    expect(spaceSchema.parse({ ...savedSpace, updatedAt }).updatedAt).toBe(
      updatedAt,
    );
  });

  it.each([null, [], {}])(
    'rejects incomplete or non-record data: %j',
    (input) => {
      expect(spaceSchema.safeParse(input).success).toBe(false);
    },
  );

  it.each([
    { id: '' },
    { id: 123 },
    { ownerId: 'not-a-uuid' },
    { ownerId: null },
    { name: '' },
    { name: '   ' },
    { name: 123 },
    { description: null },
    { description: 123 },
    { icon: '' },
    { icon: 'PenLine' },
    { icon: '<svg />' },
    { icon: 'https://example.test/icon.svg' },
    { icon: null },
    { tags: null },
    { tags: 'writing' },
    { tags: [123] },
  ])('rejects invalid fields: %j', (fields) => {
    const result = spaceSchema.safeParse({ ...savedSpace, ...fields });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe(Object.keys(fields)[0]);
    }
  });

  it.each(['id', 'ownerId', 'name', 'icon', 'tags', 'createdAt', 'updatedAt'])(
    'requires %s on saved records',
    (field) => {
      const input: Record<string, unknown> = { ...savedSpace };
      delete input[field];
      const result = spaceSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual([field]);
      }
    },
  );

  describe.each(['createdAt', 'updatedAt'])('%s', (field) => {
    it.each([
      null,
      123,
      '',
      'not-a-date',
      '2026-10-01',
      '2026-10-01T09:00:00',
      '2026-02-30T09:00:00Z',
    ])('rejects invalid or timezone-less timestamps: %j', (value) => {
      const result = spaceSchema.safeParse({ ...savedSpace, [field]: value });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual([field]);
      }
    });
  });
});

describe('spaceSchema contract', () => {
  it('keeps the saved field order of today’s Space schema', () => {
    // Zod omits an absent optional key, so pass a description to see every field.
    const parsed = spaceSchema.parse({ ...savedSpace, description: 'Notes' });
    expect(Object.keys(parsed)).toEqual([
      'name',
      'description',
      'icon',
      'tags',
      'id',
      'ownerId',
      'createdAt',
      'updatedAt',
      'pinnedAt',
      'lastViewedAt',
    ]);
  });

  it('reports the Space message for a blank name and a bad icon', () => {
    const result = spaceSchema.safeParse({
      ...savedSpace,
      name: '   ',
      icon: 'Pen Line',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toEqual(
      expect.arrayContaining([
        'Enter a space name.',
        'Use a Lucide icon name.',
      ]),
    );
  });
});

describe('Space input schemas', () => {
  it('creates a space from editable fields without saved-record metadata', () => {
    const input = createSpaceSchema.parse({
      name: '  Reading  ',
      icon: 'book-open',
      tags: ['books'],
    });
    expect(input).toEqual({
      name: 'Reading',
      icon: 'book-open',
      tags: ['books'],
    });
    expectTypeOf(input).toEqualTypeOf<CreateSpaceInput>();
  });

  it.each(['name', 'icon', 'tags'])('requires %s for creation', (field) => {
    const input: Record<string, unknown> = {
      name: 'Reading',
      icon: 'book-open',
      tags: [],
    };
    delete input[field];
    const result = createSpaceSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual([field]);
  });

  it('updates individual fields and can clear tags', () => {
    const input = updateSpaceSchema.parse({ tags: [] });
    expect(input).toEqual({ tags: [] });
    expectTypeOf(input).toEqualTypeOf<UpdateSpaceInput>();
    expect(updateSpaceSchema.parse({ name: '  Reading  ' })).toEqual({
      name: 'Reading',
    });
    expect(updateSpaceSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(updateSpaceSchema.safeParse({ tags: [123] }).success).toBe(false);
    expect(updateSpaceSchema.parse({ icon: 'house' })).toEqual({
      icon: 'house',
    });
    expect(updateSpaceSchema.safeParse({ icon: '<svg />' }).success).toBe(
      false,
    );
  });

  it('refuses server-managed fields instead of dropping them', () => {
    expect(createSpaceSchema.safeParse(savedSpace).success).toBe(false);
    expect(updateSpaceSchema.safeParse(savedSpace).success).toBe(false);
  });

  it('accepts a saved Space once projected to its editable fields', () => {
    const editable = { name: 'Writing', icon: 'pen-line', tags: ['writing'] };
    expect(editableFieldsOf(savedSpace)).toEqual(editable);
    expect(createSpaceSchema.parse(editableFieldsOf(savedSpace))).toEqual(
      editable,
    );
  });

  it('refuses an empty update', () => {
    expect(updateSpaceSchema.safeParse({}).success).toBe(false);
  });

  it('reports one Space message for a blank name', () => {
    expect(
      createSpaceSchema
        .safeParse({ name: '  ', icon: 'folder', tags: [] })
        .error?.issues.map((i) => i.message),
    ).toEqual(['Enter a space name.']);
  });
});

describe('Space write schemas keep every shared record rule', () => {
  it.each([
    ['createSpaceSchema', createSpaceSchema],
    ['updateSpaceSchema', updateSpaceSchema],
  ])('%s answers every shared limit vector as the base does', (_n, schema) => {
    expect(limitVectorMismatches(schema)).toEqual([]);
  });
});

describe('spaceSchema id', () => {
  it('keeps the base bound, so a corrupt id cannot be huge', () => {
    const result = spaceSchema.safeParse({
      ...savedSpace,
      id: 'x'.repeat(201),
    });
    expect(result.error?.issues[0]?.path).toEqual(['id']);
  });

  it('says the record message for a missing id', () => {
    const result = spaceSchema.safeParse({ ...savedSpace, id: '' });
    expect(result.error?.issues[0]?.message).toBe(RECORD_MESSAGES.missingId);
  });
});
