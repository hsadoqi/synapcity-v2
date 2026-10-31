import z from 'zod';
import { FormDefinition } from '../../../types';
import { buildSchema } from '../build-schema';
import { SchemaMessages, States, requiredByEffect } from '../build-schema';

/**
 * A `buildSchema` that remembers its results. The schema depends only on which
 * fields are visible and which are required by a dependency, so typing in a
 * field does not rebuild it while that stays the same.
 */
export function createSchemaBuilder(
  definition: FormDefinition,
  messages: SchemaMessages = {},
): (states: States) => z.ZodObject {
  const cache = new Map<string, z.ZodObject>();

  return (states) => {
    const signature = JSON.stringify(
      definition.fields.flatMap((field) => {
        if (states[field.name]?.visible !== true) return [];
        return [
          requiredByEffect(definition, field.name, states)
            ? `${field.name}!`
            : field.name,
        ];
      }),
    );
    let schema = cache.get(signature);
    if (schema === undefined) {
      schema = buildSchema(definition, states, messages);
      cache.set(signature, schema);
    }
    return schema;
  };
}
