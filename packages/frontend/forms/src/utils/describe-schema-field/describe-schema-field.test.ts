import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { describeSchemaField } from './describe-schema-field';

const schema = z.object({
  str: z.string(),
  email: z.email(),
  legacyEmail: z.string().email(),
  num: z.number(),
  flag: z.boolean(),
  pick: z.enum(['x', 'y']),
  opt: z.string().optional(),
  nul: z.string().nullable(),
  withDefault: z.string().default('x'),
  wrapped: z.number().optional().nullable(),
  list: z.array(z.string()),
  when: z.date(),
  upload: z.file(),
  optUpload: z.file().optional(),
});

describe('describeSchemaField', () => {
  it('reports the kind of plain keys', () => {
    expect(describeSchemaField(schema, 'str')).toMatchObject({
      kind: 'string',
      optional: false,
      nullable: false,
    });
    expect(describeSchemaField(schema, 'num')).toMatchObject({
      kind: 'number',
    });
    expect(describeSchemaField(schema, 'flag')).toMatchObject({
      kind: 'boolean',
    });
  });

  it('reports enum values', () => {
    expect(describeSchemaField(schema, 'pick')).toMatchObject({
      kind: 'enum',
      enumValues: ['x', 'y'],
    });
  });

  it('reports the email format for z.email() but not for the legacy z.string().email()', () => {
    expect(describeSchemaField(schema, 'email')).toMatchObject({
      kind: 'string',
      format: 'email',
    });
    expect(describeSchemaField(schema, 'legacyEmail').format).toBeUndefined();
  });

  it('reports optional and default keys as optional', () => {
    expect(describeSchemaField(schema, 'opt').optional).toBe(true);
    expect(describeSchemaField(schema, 'withDefault').optional).toBe(true);
  });

  it('reports nullable keys as nullable and unwraps to the inner kind', () => {
    expect(describeSchemaField(schema, 'nul')).toMatchObject({
      kind: 'string',
      optional: false,
      nullable: true,
    });
  });

  it('unwraps stacked wrappers', () => {
    expect(describeSchemaField(schema, 'wrapped')).toMatchObject({
      kind: 'number',
      optional: true,
      nullable: true,
    });
  });

  it('reports anything it does not map as other', () => {
    expect(describeSchemaField(schema, 'list').kind).toBe('other');
    expect(describeSchemaField(schema, 'when').kind).toBe('other');
  });

  it('throws naming the key when the schema has no such key', () => {
    expect(() => describeSchemaField(schema, 'zzz')).toThrow('zzz');
  });

  it('reports z.file() as a file, wrapped or not', () => {
    expect(describeSchemaField(schema, 'upload')).toMatchObject({
      kind: 'file',
      optional: false,
    });
    expect(describeSchemaField(schema, 'optUpload')).toMatchObject({
      kind: 'file',
      optional: true,
    });
  });
});
