import type { z } from 'zod';

export type SchemaFieldKind =
  'string' | 'number' | 'boolean' | 'enum' | 'file' | 'other';

export interface SchemaFieldDescription {
  readonly kind: SchemaFieldKind;
  /** The key accepts `undefined` (optional or defaulted). */
  readonly optional: boolean;
  /** The key accepts `null`. */
  readonly nullable: boolean;
  readonly format?: 'email';
  readonly enumValues?: readonly string[];
}

interface LooseDef {
  readonly type: string;
  readonly innerType?: z.ZodType;
  readonly format?: string;
}

/** Schema types that wrap another schema without changing what it describes. */
const WRAPPERS = new Set([
  'optional',
  'nullable',
  'default',
  'prefault',
  'nonoptional',
  'readonly',
  'catch',
]);

function definitionOf(schema: z.ZodType): LooseDef {
  return schema.def as unknown as LooseDef;
}

/** The schema a key describes once optional, nullable, default and similar wrappers are removed. */
export function unwrapSchema(schema: z.ZodType): z.ZodType {
  let current = schema;
  for (;;) {
    const { type, innerType } = definitionOf(current);
    if (!WRAPPERS.has(type) || innerType === undefined) return current;
    current = innerType;
  }
}

const isOptional = (schema: z.ZodType) => schema.safeParse(undefined).success;
const isNullable = (schema: z.ZodType) => schema.safeParse(null).success;

/**
 * Describes one key of an object schema: its kind, whether it accepts
 * `undefined` or `null`, an email format, and enum values. Read from Zod
 * 4.6.7's schema definitions; a key it cannot map is `other`.
 */
export function describeSchemaField(
  schema: z.ZodObject,
  key: string,
): SchemaFieldDescription {
  if (!Object.prototype.hasOwnProperty.call(schema.shape, key)) {
    throw new Error(`describeSchemaField: the schema has no key "${key}"`);
  }
  const field = schema.shape[key] as z.ZodType;
  const inner = unwrapSchema(field);
  const { type, format } = definitionOf(inner);
  const base = { optional: isOptional(field), nullable: isNullable(field) };

  if (type === 'string') {
    return {
      kind: 'string',
      ...base,
      ...(format === 'email' ? { format: 'email' as const } : {}),
    };
  }
  if (type === 'number') return { kind: 'number', ...base };
  if (type === 'file') return { kind: 'file', ...base };
  if (type === 'boolean') return { kind: 'boolean', ...base };
  if (type === 'enum') {
    const options = (
      inner as unknown as { readonly options: readonly unknown[] }
    ).options;
    if (
      options.every((option): option is string => typeof option === 'string')
    ) {
      return { kind: 'enum', ...base, enumValues: options };
    }
  }
  return { kind: 'other', ...base };
}
