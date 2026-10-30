import { z } from 'zod';

import type { FieldState, FormDefinition } from '../../../types';
import { isEmptyValue } from '../../../utils/is-empty-value';

export const DEFAULT_REQUIRED_MESSAGE = 'This field is required';

export interface SchemaMessages {
  readonly required?: string;
}

export type States = Readonly<Record<string, FieldState>>;

/**
 * A field the schema already requires keeps the schema's own rules. Only a
 * field that is required by a `require` dependency, while its schema key
 * accepts `undefined` or `null`, needs the extra non-empty check.
 */
export function requiredByEffect(
  definition: FormDefinition,
  name: string,
  states: States,
): boolean {
  return (
    states[name]?.required === true && definition.baseRequired[name] !== true
  );
}

/**
 * The validation schema for the current field states: the caller's schema
 * narrowed to the visible fields. It is built from `schema.shape`, never with
 * `.pick()`, which throws on a refined schema in Zod 4.6.7. Hidden fields are
 * absent from it, so they neither fail validation nor reach the parsed output.
 * A field required by a `require` dependency also fails when empty, with the
 * `required` message. A cross-field rule is applied only while every field it
 * reads is visible.
 */
export function buildSchema(
  definition: FormDefinition,
  states: States,
  messages: SchemaMessages = {},
): z.ZodObject {
  const requiredMessage = messages.required ?? DEFAULT_REQUIRED_MESSAGE;
  const shape: Record<string, z.ZodType> = {};

  for (const field of definition.fields) {
    if (states[field.name]?.visible !== true) continue;
    const base = definition.schema.shape[field.name] as z.ZodType;
    // Zod skips an optional key that is absent from the input, so a plain
    // refinement on `base` would never run for a field the user left untouched.
    // Starting from `unknown` makes the key always validated, and checking for
    // an empty value before piping into `base` means an empty field reports
    // only "required", not also the schema's own rule for a non-empty value.
    shape[field.name] = requiredByEffect(definition, field.name, states)
      ? z
          .unknown()
          .refine((value) => !isEmptyValue(value), { message: requiredMessage })
          .pipe(base)
      : base;
  }

  const visible = (name: string): boolean => states[name]?.visible === true;
  const rules = definition.rules.filter(
    (rule) => rule.fields.every(visible) && visible(rule.path),
  );
  const object = z.object(shape);
  if (rules.length === 0) return object;

  return object.superRefine((values, context) => {
    for (const rule of rules) {
      const message = rule.check(values);
      if (message !== undefined)
        context.addIssue({ code: 'custom', message, path: [rule.path] });
    }
  });
}
