import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { FieldConfig, FieldDependency, FormRule } from '../../../types';
import { defineForm } from '../define-form';
import { resolveFieldStates } from '../resolve-field-states';
import { buildSchema } from './build-schema';
import { createSchemaBuilder } from '../create-schema-builder';

const schema = z.object({
  name: z.string().min(3, 'Too short'),
  must: z.string(),
  email: z.string().min(5, 'Short email').optional(),
  flag: z.boolean().optional(),
  hideMust: z.boolean().optional(),
  extra: z.string(),
  password: z.string().optional(),
  confirm: z.string().optional(),
});

type Names = keyof z.infer<typeof schema> & string;

const field = (
  name: Names,
  dependencies: readonly FieldDependency<Names>[] = [],
): FieldConfig<Names> => ({ type: 'text', name, label: name, dependencies });

const when = (
  effect: FieldDependency<Names>['effect'],
  name: Names,
  value: unknown,
): FieldDependency<Names> => ({
  effect,
  match: 'all',
  conditions: [{ field: name, operator: 'equals', value }],
});

const fields: readonly FieldConfig<Names>[] = [
  field('name'),
  field('must', [when('hide', 'hideMust', true)]),
  field('email', [
    when('require', 'flag', true),
    when('disable', 'name', 'off'),
  ]),
  field('flag'),
  field('hideMust'),
];

const definition = defineForm({ schema, fields });

function parse(
  values: Record<string, unknown>,
  messages?: { required?: string },
) {
  const states = resolveFieldStates(definition, values);
  return buildSchema(definition, states, messages).safeParse(values);
}

describe('buildSchema', () => {
  it('omits hidden fields, so a hidden required field does not fail parsing', () => {
    expect(parse({ name: 'abc', hideMust: true }).success).toBe(true);
    expect(parse({ name: 'abc', hideMust: false }).success).toBe(false);
  });

  it('strips hidden fields from the parsed output', () => {
    const result = parse({ name: 'abc', hideMust: true, must: 'typed' });
    expect(result.success && result.data).toEqual({
      name: 'abc',
      hideMust: true,
    });
  });

  it('keeps a disabled field in the output and still validates it', () => {
    const values = { name: 'off', must: 'm', email: 'abc' };
    expect(resolveFieldStates(definition, values).email?.enabled).toBe(false);
    const invalid = parse(values);
    expect(!invalid.success && invalid.error.issues).toEqual([
      expect.objectContaining({ path: ['email'], message: 'Short email' }),
    ]);
    const valid = parse({ ...values, email: 'abcde' });
    expect(valid.success && valid.data).toMatchObject({ email: 'abcde' });
  });

  it('fails a required field whose key is absent from the values, not only an empty one', () => {
    const result = parse({ name: 'abc', must: 'm', flag: true });
    expect(!result.success && result.error.issues).toEqual([
      expect.objectContaining({
        path: ['email'],
        message: 'This field is required',
      }),
    ]);
  });

  it('fails an empty value for a field whose require effect is met, at that field with the required message', () => {
    for (const email of ['', undefined]) {
      const result = parse({ name: 'abc', must: 'm', flag: true, email });
      expect(result.success).toBe(false);
      expect(!result.success && result.error.issues).toEqual([
        expect.objectContaining({
          path: ['email'],
          message: 'This field is required',
        }),
      ]);
    }
    expect(
      parse({ name: 'abc', must: 'm', flag: true, email: 'a@b.c' }).success,
    ).toBe(true);
  });

  it('does not require the field while the require effect is not met', () => {
    expect(parse({ name: 'abc', must: 'm', flag: false }).success).toBe(true);
  });

  it("uses the caller's required message when given", () => {
    const result = parse(
      { name: 'abc', must: 'm', flag: true },
      { required: 'Fill this in' },
    );
    expect(!result.success && result.error.issues[0]?.message).toBe(
      'Fill this in',
    );
  });

  it("passes the caller's schema messages through unchanged", () => {
    const result = parse({ name: 'ab', must: 'm' });
    expect(!result.success && result.error.issues).toEqual([
      expect.objectContaining({ path: ['name'], message: 'Too short' }),
    ]);
  });

  it('validates only keys that have a field', () => {
    // `extra` is a required key of the schema with no field: it must not fail the form.
    expect(parse({ name: 'abc', must: 'm' }).success).toBe(true);
  });

  it('does not change the caller schema', () => {
    const before = Object.keys(schema.shape);
    parse({ name: 'abc', hideMust: true });
    expect(Object.keys(schema.shape)).toEqual(before);
  });
});

describe('buildSchema rules', () => {
  const rule: FormRule<Names> = {
    fields: ['password', 'confirm'],
    path: 'confirm',
    check: (values) =>
      values.password === values.confirm ? undefined : 'Passwords differ',
  };
  const ruleFields = [
    field('password'),
    field('confirm', [when('hide', 'flag', true)]),
    field('flag'),
  ];
  const ruled = defineForm({ schema, fields: ruleFields, rules: [rule] });

  const parseRuled = (values: Record<string, unknown>) =>
    buildSchema(ruled, resolveFieldStates(ruled, values)).safeParse(values);

  it("lands a rule's message on its path field", () => {
    const result = parseRuled({ password: 'a', confirm: 'b' });
    expect(!result.success && result.error.issues).toEqual([
      expect.objectContaining({
        path: ['confirm'],
        message: 'Passwords differ',
      }),
    ]);
    expect(parseRuled({ password: 'a', confirm: 'a' }).success).toBe(true);
  });

  it('runs a rule only while all of its fields are visible', () => {
    expect(
      parseRuled({ password: 'a', confirm: 'b', flag: true }).success,
    ).toBe(true);
  });
});

describe('createSchemaBuilder', () => {
  const builder = createSchemaBuilder(definition);
  const statesFor = (values: Record<string, unknown>) =>
    resolveFieldStates(definition, values);

  it('returns the same schema instance for states with the same visible and required fields', () => {
    const first = builder(statesFor({ name: 'a', hideMust: false }));
    const second = builder(
      statesFor({ name: 'abc', hideMust: false, must: 'typed' }),
    );
    expect(second).toBe(first);
  });

  it("returns a new schema when a field's visibility changes", () => {
    const shown = builder(statesFor({ hideMust: false }));
    const hidden = builder(statesFor({ hideMust: true }));
    expect(hidden).not.toBe(shown);
  });

  it("returns a new schema when a field's requirement changes", () => {
    const optional = builder(statesFor({ flag: false }));
    const required = builder(statesFor({ flag: true }));
    expect(required).not.toBe(optional);
  });

  it('uses the messages it was created with', () => {
    const custom = createSchemaBuilder(definition, { required: 'Needed' });
    const values = { name: 'abc', must: 'm', flag: true };
    const result = custom(resolveFieldStates(definition, values)).safeParse(
      values,
    );
    expect(!result.success && result.error.issues[0]?.message).toBe('Needed');
  });
});
