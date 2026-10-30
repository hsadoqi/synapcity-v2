import vectors from './limit-vectors.json' with { type: 'json' };

/*
 * The shared boundary vectors for the D5 metadata limits, and the function that
 * builds their values. Test support only: the zod schemas' own test and the
 * database test in `@synapcity/server-data` both read them.
 */

type Generator =
  | { repeat: string; times: number; prefix?: string; suffix?: string }
  | { distinct: number }
  | { units: number[] };
export type VectorValue = string | Generator | VectorValue[];

export type LimitVector = {
  id: string;
  field: 'name' | 'description' | 'icon' | 'tags';
  value: VectorValue;
  zod: 'accept' | 'reject';
  /** What the input schema keeps when it differs from `value` (it trims). */
  zodOutput?: VectorValue;
  /** The outcome of inserting `value` exactly as given. */
  db: 'accept' | 'reject';
  note?: string;
};

export const LIMIT_VECTORS = vectors.cases as LimitVector[];

/** Builds the string or array a vector stands for. */
export function expandVectorValue(value: VectorValue): string | string[] {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.flatMap((item) => expandItem(item));
  if ('units' in value) return String.fromCharCode(...value.units);
  if ('distinct' in value) {
    return Array.from({ length: value.distinct }, (_, i) => `t${i + 1}`);
  }
  return `${value.prefix ?? ''}${value.repeat.repeat(value.times)}${value.suffix ?? ''}`;
}

function expandItem(item: VectorValue): string[] {
  const built = expandVectorValue(item);
  return Array.isArray(built) ? built : [built];
}

type WriteSchema = {
  safeParse(
    value: unknown,
  ):
    | { success: true; data: Record<string, unknown> }
    | { success: false; error: { issues: unknown[] } };
};

/** Valid editable fields; each vector replaces one of them. */
const VALID_FIELDS = { name: 'n', icon: 'folder', tags: [] as string[] };

/**
 * Every shared vector through a kind's write schema (a create, input or patch
 * schema built on the base fields), with the other fields valid. Returns one
 * line per vector the schema answers differently from the shared contract, so
 * a kind that drops or loosens a base rule fails its own test: an empty list
 * means the kind keeps every D5 limit and text rule.
 */
export function limitVectorMismatches(schema: WriteSchema): string[] {
  const mismatches: string[] = [];
  for (const vector of LIMIT_VECTORS) {
    const value = expandVectorValue(vector.value);
    const result = schema.safeParse({ ...VALID_FIELDS, [vector.field]: value });
    if (result.success !== (vector.zod === 'accept')) {
      mismatches.push(
        `${vector.id}: expected ${vector.zod}, got ${result.success ? 'accept' : 'reject'}`,
      );
      continue;
    }
    if (result.success) {
      const expected =
        vector.zodOutput === undefined
          ? value
          : expandVectorValue(vector.zodOutput);
      if (
        JSON.stringify(result.data[vector.field]) !== JSON.stringify(expected)
      ) {
        mismatches.push(`${vector.id}: kept a different value`);
      }
    }
  }
  return mismatches;
}
