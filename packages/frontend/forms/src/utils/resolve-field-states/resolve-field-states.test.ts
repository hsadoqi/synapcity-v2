import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type {
  ConditionOperator,
  FieldConfig,
  FieldDependency,
  DependencyEffect,
} from '../../types';
import { defineForm } from '../define-form';
import { resolveFieldStates } from './resolve-field-states';

const schema = z.object({
  a: z.string().optional(),
  b: z.string().optional(),
  c: z.string().optional(),
  n: z.number().optional(),
  t: z.string(),
  flag: z.boolean().optional(),
});

type Names = 'a' | 'b' | 'c' | 'n' | 't' | 'flag';

const when = (field: Names, operator: ConditionOperator, value?: unknown) => ({
  field,
  operator,
  value,
});

const dependency = (
  effect: DependencyEffect,
  conditions: FieldDependency<Names>['conditions'],
  match: 'all' | 'any' = 'all',
): FieldDependency<Names> => ({ effect, conditions, match });

const field = (
  name: Names,
  dependencies: readonly FieldDependency<Names>[] = [],
): FieldConfig<Names> => ({ type: 'text', name, label: name, dependencies });

const states = (
  fields: readonly FieldConfig<Names>[],
  values: Record<string, unknown>,
) => resolveFieldStates(defineForm({ schema, fields }), values);

describe('resolveFieldStates', () => {
  it('shows a field only while its show condition is met', () => {
    const fields = [
      field('a'),
      field('b', [dependency('show', [when('a', 'equals', 'yes')])]),
    ];
    expect(states(fields, { a: 'no' }).b?.visible).toBe(false);
    expect(states(fields, { a: 'yes' }).b?.visible).toBe(true);
  });

  it('shows a field with no show dependency', () => {
    expect(states([field('a')], {}).a).toEqual({
      visible: true,
      enabled: true,
      required: false,
    });
  });

  it('needs every show dependency to be met', () => {
    const fields = [
      field('a'),
      field('c'),
      field('b', [
        dependency('show', [when('a', 'equals', 'x')]),
        dependency('show', [when('c', 'equals', 'y')]),
      ]),
    ];
    expect(states(fields, { a: 'x', c: 'y' }).b?.visible).toBe(true);
    expect(states(fields, { a: 'x', c: 'n' }).b?.visible).toBe(false);
  });

  it('hides a field while any hide condition is met', () => {
    const fields = [
      field('a'),
      field('b', [dependency('hide', [when('a', 'equals', 'x')])]),
    ];
    expect(states(fields, { a: 'x' }).b?.visible).toBe(false);
    expect(states(fields, { a: 'y' }).b?.visible).toBe(true);
  });

  it('match any needs one condition, match all needs every condition', () => {
    const conditions = [when('a', 'equals', 'x'), when('c', 'equals', 'y')];
    const all = [
      field('a'),
      field('c'),
      field('b', [dependency('show', conditions, 'all')]),
    ];
    const any = [
      field('a'),
      field('c'),
      field('b', [dependency('show', conditions, 'any')]),
    ];
    expect(states(all, { a: 'x', c: 'n' }).b?.visible).toBe(false);
    expect(states(any, { a: 'x', c: 'n' }).b?.visible).toBe(true);
    expect(states(any, { a: 'n', c: 'n' }).b?.visible).toBe(false);
  });

  it('disable and enable set enabled', () => {
    const disabled = [
      field('a'),
      field('b', [dependency('disable', [when('a', 'equals', 'x')])]),
    ];
    const enabled = [
      field('a'),
      field('b', [dependency('enable', [when('a', 'equals', 'x')])]),
    ];
    expect(states(disabled, { a: 'x' }).b?.enabled).toBe(false);
    expect(states(disabled, { a: 'y' }).b?.enabled).toBe(true);
    expect(states(enabled, { a: 'x' }).b?.enabled).toBe(true);
    expect(states(enabled, { a: 'y' }).b?.enabled).toBe(false);
  });

  it('a field the schema does not mark optional is required without any dependency', () => {
    const result = states([field('t'), field('a')], {});
    expect(result.t?.required).toBe(true);
    expect(result.a?.required).toBe(false);
  });

  it('require makes a field required only while met', () => {
    const fields = [
      field('flag'),
      field('a', [dependency('require', [when('flag', 'equals', true)])]),
    ];
    expect(states(fields, { flag: true }).a?.required).toBe(true);
    expect(states(fields, { flag: false }).a?.required).toBe(false);
  });

  it('a hidden field reads as empty to its dependents', () => {
    const fields = [
      field('a'),
      field('b', [dependency('hide', [when('a', 'equals', 'hide')])]),
      field('c', [dependency('show', [when('b', 'isEmpty')])]),
    ];
    expect(states(fields, { a: 'hide', b: 'typed' }).c?.visible).toBe(true);
    expect(states(fields, { a: 'show', b: 'typed' }).c?.visible).toBe(false);
  });

  it('reads values in dependency order whatever the field order', () => {
    const fields = [
      field('c', [dependency('show', [when('b', 'isEmpty')])]),
      field('b', [dependency('hide', [when('a', 'equals', 'hide')])]),
      field('a'),
    ];
    expect(states(fields, { a: 'hide', b: 'typed' }).c?.visible).toBe(true);
  });

  it('equals and notEquals compare strictly', () => {
    const fields = [
      field('n'),
      field('a', [dependency('show', [when('n', 'equals', 1)])]),
      field('b', [dependency('show', [when('n', 'notEquals', 1)])]),
    ];
    expect(states(fields, { n: 1 })).toMatchObject({
      a: { visible: true },
      b: { visible: false },
    });
    expect(states(fields, { n: '1' })).toMatchObject({
      a: { visible: false },
      b: { visible: true },
    });
  });

  it('isEmpty is true for empty values and false for 0 and false', () => {
    const fields = [
      field('n'),
      field('a', [dependency('show', [when('n', 'isEmpty')])]),
    ];
    expect(states(fields, { n: 0 }).a?.visible).toBe(false);
    expect(states(fields, { n: undefined }).a?.visible).toBe(true);
    expect(states(fields, { n: Number.NaN }).a?.visible).toBe(true);
  });

  it('gt and lt are false for non-numeric values and compare numeric strings as numbers', () => {
    const fields = [
      field('n'),
      field('a', [dependency('show', [when('n', 'gt', 3)])]),
      field('b', [dependency('show', [when('n', 'lt', 3)])]),
    ];
    for (const value of [undefined, null, '', 'abc', Number.NaN, {}]) {
      expect(states(fields, { n: value })).toMatchObject({
        a: { visible: false },
        b: { visible: false },
      });
    }
    expect(states(fields, { n: 5 }).a?.visible).toBe(true);
    expect(states(fields, { n: '5' }).a?.visible).toBe(true);
    expect(states(fields, { n: 1 }).b?.visible).toBe(true);
  });

  it('contains works on strings and arrays and is false for undefined', () => {
    const fields = [
      field('a'),
      field('b', [dependency('show', [when('a', 'contains', 'ell')])]),
    ];
    expect(states(fields, { a: 'hello' }).b?.visible).toBe(true);
    expect(states(fields, { a: 'world' }).b?.visible).toBe(false);
    expect(states(fields, { a: ['x', 'ell'] }).b?.visible).toBe(true);
    expect(states(fields, { a: undefined }).b?.visible).toBe(false);
    const undefinedNeedle = [
      field('a'),
      field('b', [dependency('show', [when('a', 'contains', undefined)])]),
    ];
    expect(states(undefinedNeedle, { a: 'anything' }).b?.visible).toBe(false);
  });

  it('resolves generated acyclic definitions without looping', () => {
    const keys = ['a', 'b', 'c', 'n', 't', 'flag'] as const;
    let seed = 20261024;
    const random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const effects: DependencyEffect[] = [
      'show',
      'hide',
      'enable',
      'disable',
      'require',
    ];
    const operators: ConditionOperator[] = [
      'equals',
      'notEquals',
      'contains',
      'gt',
      'lt',
      'isEmpty',
    ];
    const pick = <T>(list: readonly T[]): T =>
      list[Math.floor(random() * list.length)] as T;

    for (let round = 0; round < 200; round += 1) {
      // Field i may only read fields before it, so the definition is acyclic.
      const built = keys.map((name, index) =>
        field(
          name,
          index === 0
            ? []
            : [
                dependency(
                  pick(effects),
                  [
                    when(
                      pick(keys.slice(0, index)),
                      pick(operators),
                      pick(['x', 1, true, undefined]),
                    ),
                  ],
                  pick(['all', 'any']),
                ),
              ],
        ),
      );
      const shuffled = [...built].sort(() => random() - 0.5);
      const values = Object.fromEntries(
        keys.map((name) => [name, pick(['x', 1, '', undefined, true, null])]),
      );
      const result = states(shuffled, values);
      expect(Object.keys(result).sort()).toEqual([...keys].sort());
      expect(result.a).toMatchObject({ visible: true, enabled: true });
    }
  });
});
