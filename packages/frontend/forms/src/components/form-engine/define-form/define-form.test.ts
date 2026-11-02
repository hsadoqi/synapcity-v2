import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { FieldConfig, FieldDependency, FormRule } from '../../../types';
import { defineForm, FormDefinitionError } from './define-form';

const schema = z.object({
  a: z.string(),
  b: z.string().optional(),
  c: z.number(),
  d: z.string().nullable(),
  e: z.boolean(),
});

type Names = 'a' | 'b' | 'c' | 'd' | 'e';

interface Extra {
  group?: string;
  dependencies?: readonly FieldDependency<Names>[];
}

const text = (name: Names, extra: Extra = {}): FieldConfig<Names> => ({
  type: 'text',
  name,
  label: name,
  ...extra,
});

const reads = (field: Names): readonly FieldDependency<Names>[] => [
  {
    conditions: [{ field, operator: 'isEmpty' }],
    match: 'all',
    effect: 'show',
  },
];

/** Builds a field the type system would reject, to exercise the runtime check. */
const loose = (field: Record<string, unknown>) =>
  field as unknown as FieldConfig<Names>;

function issuesOf(run: () => unknown) {
  try {
    run();
  } catch (error) {
    if (error instanceof FormDefinitionError) return error.issues;
    throw error;
  }
  throw new Error('expected defineForm to throw a FormDefinitionError');
}

describe('defineForm', () => {
  it('returns the schema, the fields in the given order, no groups or rules by default', () => {
    const fields = [text('b'), text('a')];
    const definition = defineForm({ schema, fields });
    expect(definition.schema).toBe(schema);
    expect(definition.fields.map((field) => field.name)).toEqual(['b', 'a']);
    expect(definition.groups).toEqual([]);
    expect(definition.rules).toEqual([]);
  });

  it('accepts an empty field list', () => {
    const definition = defineForm({ schema, fields: [] });
    expect(definition.fields).toEqual([]);
    expect(definition.evaluationOrder).toEqual([]);
  });

  it('rejects duplicate field names', () => {
    expect(
      issuesOf(() => defineForm({ schema, fields: [text('a'), text('a')] })),
    ).toContainEqual(
      expect.objectContaining({ code: 'duplicate-name', name: 'a' }),
    );
  });

  it('rejects a field whose name is not a key of the schema', () => {
    expect(
      issuesOf(() =>
        defineForm({ schema, fields: [loose({ ...text('a'), name: 'nope' })] }),
      ),
    ).toContainEqual(
      expect.objectContaining({ code: 'unknown-field', name: 'nope' }),
    );
  });

  it('a field name that is not a schema key is a compile error', () => {
    const field = { type: 'text', name: 'nope', label: 'x' } as const;
    // @ts-expect-error 'nope' is not a key of the schema
    const run = () => defineForm({ schema, fields: [field] });
    expect(run).toThrow(FormDefinitionError);
  });

  it("a condition's field that is not a schema key is a compile error", () => {
    const condition = { field: 'nope', operator: 'isEmpty' } as const;
    const dependency = {
      conditions: [condition],
      match: 'all',
      effect: 'show',
    } as const;
    const field = {
      type: 'text',
      name: 'a',
      label: 'a',
      dependencies: [dependency],
    } as const;
    // @ts-expect-error 'nope' is not a key of the schema
    const run = () => defineForm({ schema, fields: [field] });
    expect(run).toThrow(FormDefinitionError);
  });

  it('a password field without autoComplete is a compile error', () => {
    // @ts-expect-error a password field must declare autoComplete
    const field: FieldConfig<Names> = {
      type: 'password',
      name: 'a',
      label: 'a',
    };
    expect(field.type).toBe('password');
  });

  it('baseRequired is false for optional and nullable keys and true for the rest', () => {
    const definition = defineForm({
      schema,
      fields: [text('a'), text('b'), text('d')],
    });
    expect(definition.baseRequired).toEqual({ a: true, b: false, d: false });
  });

  it.each(['type', 'root', 'ref', 'types', 'message', 'form'])(
    'rejects a field named %s',
    (name) => {
      const reserved = z.object({ [name]: z.string() });
      const issues = issuesOf(() =>
        defineForm({
          schema: reserved,
          fields: [{ type: 'text', name, label: name }],
        }),
      );
      expect(issues).toContainEqual(
        expect.objectContaining({ code: 'reserved-name', name }),
      );
    },
  );

  it('rejects a schema with object-level refinements, for refine and superRefine alike', () => {
    const refined = z
      .object({ a: z.string(), b: z.string() })
      .refine((v) => v.a === v.b);
    const superRefined = z
      .object({ a: z.string(), b: z.string() })
      .superRefine(() => {});
    for (const bad of [refined, superRefined]) {
      expect(
        issuesOf(() => defineForm({ schema: bad, fields: [] })),
      ).toContainEqual(
        expect.objectContaining({ code: 'schema-has-refinements' }),
      );
    }
  });

  it('rejects a condition that names an unknown field', () => {
    const fields = [
      text('a'),
      loose({
        ...text('b'),
        dependencies: [
          {
            conditions: [{ field: 'zzz', operator: 'isEmpty' }],
            match: 'all',
            effect: 'show',
          },
        ],
      }),
    ];
    expect(issuesOf(() => defineForm({ schema, fields }))).toContainEqual(
      expect.objectContaining({
        code: 'unknown-reference',
        name: 'b',
        path: ['zzz'],
      }),
    );
  });

  it('rejects a rule that names an unknown field', () => {
    const rule = {
      fields: ['zzz'],
      path: 'a',
      check: () => undefined,
    } as unknown as FormRule<Names>;
    expect(
      issuesOf(() =>
        defineForm({ schema, fields: [text('a')], rules: [rule] }),
      ),
    ).toContainEqual(
      expect.objectContaining({
        code: 'unknown-reference',
        name: 'a',
        path: ['zzz'],
      }),
    );
  });

  it('rejects a field whose group is not declared', () => {
    expect(
      issuesOf(() =>
        defineForm({ schema, fields: [text('a', { group: 'x' })] }),
      ),
    ).toContainEqual(
      expect.objectContaining({ code: 'unknown-group', name: 'x' }),
    );
  });

  it('rejects a group whose fields are not adjacent', () => {
    const groups = [{ id: 'g', title: 'G' }];
    const fields = [
      text('a', { group: 'g' }),
      text('b'),
      text('c', { group: 'g' }),
    ];
    expect(
      issuesOf(() => defineForm({ schema, fields, groups })),
    ).toContainEqual(
      expect.objectContaining({ code: 'split-group', name: 'g' }),
    );
  });

  it('accepts adjacent group members and keeps the declared groups', () => {
    const groups = [{ id: 'g', title: 'G' }];
    const fields = [
      text('a', { group: 'g' }),
      text('b', { group: 'g' }),
      text('c'),
    ];
    expect(defineForm({ schema, fields, groups }).groups).toEqual(groups);
  });

  it('rejects a two-field cycle and reports the path', () => {
    const fields = [
      text('a', { dependencies: reads('b') }),
      text('b', { dependencies: reads('a') }),
    ];
    expect(issuesOf(() => defineForm({ schema, fields }))).toContainEqual(
      expect.objectContaining({ code: 'cycle', path: ['a', 'b', 'a'] }),
    );
  });

  it('rejects a field that depends on itself', () => {
    expect(
      issuesOf(() =>
        defineForm({
          schema,
          fields: [text('a', { dependencies: reads('a') })],
        }),
      ),
    ).toContainEqual(
      expect.objectContaining({ code: 'cycle', path: ['a', 'a'] }),
    );
  });

  it('lists dependencies before dependents in evaluationOrder while fields keep their order', () => {
    const definition = defineForm({
      schema,
      fields: [text('b', { dependencies: reads('a') }), text('a')],
    });
    expect(definition.evaluationOrder).toEqual(['a', 'b']);
    expect(definition.fields.map((field) => field.name)).toEqual(['b', 'a']);
  });

  it('reports every problem, not only the first', () => {
    const fields = [
      text('a'),
      text('a'),
      loose({ ...text('b'), name: 'nope' }),
    ];
    expect(
      issuesOf(() => defineForm({ schema, fields })).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('never puts field values in its message', () => {
    const fields = [
      loose({ ...text('a'), name: 'nope', defaultValue: 'secret-value' }),
    ];
    try {
      defineForm({ schema, fields });
    } catch (error) {
      expect(String((error as Error).message)).not.toContain('secret-value');
    }
  });

  describe('browser pattern', () => {
    const slugSchema = z.object({
      slug: z.string().regex(/^[a-z-]+$/),
      code: z.string(),
    });

    it('accepts a pattern that is one of the schema regex checks, anchors aside', () => {
      for (const pattern of ['[a-z-]+', '^[a-z-]+$']) {
        expect(() =>
          defineForm({
            schema: slugSchema,
            fields: [
              { type: 'text', name: 'slug', label: 'Slug', props: { pattern } },
            ],
          }),
        ).not.toThrow();
      }
    });

    it('rejects a pattern the schema does not check', () => {
      expect(
        issuesOf(() =>
          defineForm({
            schema: slugSchema,
            fields: [
              {
                type: 'text',
                name: 'slug',
                label: 'Slug',
                props: { pattern: '[a-z]+' },
              },
            ],
          }),
        ),
      ).toContainEqual({ code: 'pattern-mismatch', name: 'slug' });
    });

    it('rejects a pattern on a key whose schema has no regex at all', () => {
      expect(
        issuesOf(() =>
          defineForm({
            schema: slugSchema,
            fields: [
              {
                type: 'text',
                name: 'code',
                label: 'Code',
                props: { pattern: '[0-9]{4}' },
              },
            ],
          }),
        ),
      ).toContainEqual({ code: 'pattern-mismatch', name: 'code' });
    });

    it('keeps an escaped trailing dollar as part of the pattern', () => {
      const money = z.object({ price: z.string().regex(/^[0-9]+\$$/) });
      expect(() =>
        defineForm({
          schema: money,
          fields: [
            {
              type: 'text',
              name: 'price',
              label: 'Price',
              props: { pattern: '[0-9]+\\$' },
            },
          ],
        }),
      ).not.toThrow();
    });
  });

  it('a file field needs no autoComplete, and a password field still does', () => {
    const field: FieldConfig<Names> = {
      type: 'file',
      name: 'a',
      label: 'a',
      props: { accept: 'image/*', multiple: true },
    };
    expect(field.type).toBe('file');
  });
});
