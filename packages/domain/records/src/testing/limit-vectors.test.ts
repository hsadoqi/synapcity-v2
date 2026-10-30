import { describe, expect, it } from 'vitest';

import { z } from 'zod';

import { RECORD_MESSAGES } from '../constants';
import {
  baseRecordCreateSchema,
  baseRecordInputSchema,
  baseRecordPatchSchema,
} from '../schemas';
import {
  expandVectorValue,
  LIMIT_VECTORS,
  limitVectorMismatches,
} from './limit-vectors';

/*
 * Every shared boundary vector through the zod input schema. The same file is
 * run against PostgreSQL by `@synapcity/server-data`'s database test, so the
 * two are held to one list.
 */
const VALID = { name: 'n', icon: 'folder', tags: [] as string[] };

function parse(field: string, value: string | string[]) {
  return baseRecordInputSchema.safeParse({ ...VALID, [field]: value });
}

describe('limit vectors', () => {
  it('cover every field and every kind of outcome', () => {
    const fields = new Set(LIMIT_VECTORS.map((v) => v.field));
    expect([...fields].sort()).toEqual(['description', 'icon', 'name', 'tags']);
    expect(new Set(LIMIT_VECTORS.map((v) => v.id)).size).toBe(
      LIMIT_VECTORS.length,
    );
    expect(
      LIMIT_VECTORS.some((v) => v.zod === 'accept' && v.db === 'reject'),
    ).toBe(true);
  });

  it.each(LIMIT_VECTORS.map((v) => [v.id, v] as const))('%s', (_id, vector) => {
    const value = expandVectorValue(vector.value);
    const result = parse(vector.field, value);

    expect(result.success, JSON.stringify(result.error?.issues)).toBe(
      vector.zod === 'accept',
    );
    if (result.success && vector.zodOutput !== undefined) {
      expect(result.data[vector.field]).toEqual(
        expandVectorValue(vector.zodOutput),
      );
    } else if (result.success) {
      expect(result.data[vector.field]).toEqual(value);
    }
  });

  it('counts code points: an emoji is one character, not two', () => {
    expect(parse('name', '😀'.repeat(120)).success).toBe(true);
    expect('😀'.repeat(120).length).toBe(240);
  });

  it('never truncates: an over-limit value is rejected, not cut', () => {
    const result = parse('name', 'a'.repeat(121));
    expect(result.success).toBe(false);
  });

  it('reports a clear message for an over-long name, tags and description', () => {
    const name = parse('name', 'a'.repeat(121));
    expect(name.error?.issues[0]?.message).toBe(RECORD_MESSAGES.nameTooLong);
    expect(parse('tags', { length: 0 } as never).success).toBe(false);
    const tags = parse('tags', expandVectorValue({ distinct: 21 }));
    expect(tags.error?.issues[0]?.message).toBe(RECORD_MESSAGES.tooManyTags);
    const description = parse('description', 'd'.repeat(2001));
    expect(description.error?.issues[0]?.message).toBe(
      RECORD_MESSAGES.descriptionTooLong,
    );
  });
});

describe('limitVectorMismatches (the conformance check each kind runs)', () => {
  it.each([
    ['baseRecordInputSchema', baseRecordInputSchema],
    ['baseRecordCreateSchema', baseRecordCreateSchema],
    ['baseRecordPatchSchema', baseRecordPatchSchema],
  ])('%s keeps every shared rule', (_name, schema) => {
    expect(limitVectorMismatches(schema)).toEqual([]);
  });

  it('reports a schema that loosens a rule', () => {
    const loose = z.object({
      name: z.string(),
      icon: z.string(),
      tags: z.array(z.string()),
      description: z.string().optional(),
    });
    expect(limitVectorMismatches(loose)).toContain(
      'name-121: expected reject, got accept',
    );
  });
});
